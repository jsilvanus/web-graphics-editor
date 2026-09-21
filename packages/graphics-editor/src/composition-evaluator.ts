import type { AnimationValue, Composition, EvaluatedVideo, EvaluationTime, GraphicsDocument, Graphics3DView, Layer, Scene } from "./types";
import { evaluateAnimationKeyframes } from "./animation";
import { buildRenderTree, type RenderNode } from "./render-model";
import { resolveComposition, resolveScene, type ResolvedComposition, type ResolvedScene } from "./presentation";
import { evaluate3DViewAtTime } from "./3d-animation";
import { map3DViewTime, mapMediaTime } from "./time";

/**
 * The runtime boundary between the persistent document and rendering.
 *
 * Phase 1 deliberately does not change layer properties. It establishes a
 * stable, immutable snapshot that later phases can extend with animation,
 * media-time mapping, 3D evaluation, and compositing.
 */
export interface CompositionEvaluation {
  kind: "composition";
  composition: Composition;
  /** Time in the composition's own time domain. */
  time: number;
  timeDomain: EvaluationTime;
  layers: Layer[];
  renderTree: RenderNode[];
  videos: EvaluatedVideo[];
  views3d: Graphics3DView[];
}

export interface SceneEvaluation {
  kind: "scene";
  composition: Composition;
  scene: Scene;
  /** Time in the outer document/presentation timeline. */
  globalTime: number;
  /** Time relative to the active scene. */
  localTime: number;
  /** Alias for the composition-local evaluation time. */
  time: number;
  layers: Layer[];
  renderTree: RenderNode[];
}

function setProperty(target: Record<string, unknown>, property: string, value: AnimationValue): void {
  const parts = property.split(".").filter(Boolean);
  if (!parts.length) return;
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = cursor[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function applyCompositionAnimation(
  composition: Composition,
  layers: Layer[],
  time: number,
): Layer[] {
  const tracks = composition.timeline?.tracks ?? [];
  if (!tracks.length) return layers;

  const byId = new Map(layers.map(layer => [layer.id, layer]));
  for (const track of tracks) {
    const layer = byId.get(track.targetId);
    if (!layer) continue;
    const value = evaluateAnimationKeyframes(track.keyframes, time);
    if (value === undefined) continue;
    setProperty(layer as unknown as Record<string, unknown>, track.property, value);
  }
  return layers;
}

function evaluateVideos(document: GraphicsDocument, layers: Layer[], time:number): EvaluatedVideo[] {
  const assets=new Map((document.assets??[]).map(asset=>[asset.id,asset]));
  return layers.flatMap(layer=>{
    if(layer.type!=="video"||!layer.videoAssetId)return [];
    const asset=assets.get(layer.videoAssetId);
    if(!asset||asset.type!=="video")return [];
    const mediaTime=mapMediaTime(time,{
      offset:layer.timeOffset??0,
      rate:layer.playbackRate??1,
      loop:layer.loop??false,
      inPoint:layer.sourceIn,
      outPoint:layer.sourceOut,
    });
    return [{layerId:layer.id,assetId:asset.id,mediaTime,playing:true,sourceIn:layer.sourceIn,sourceOut:layer.sourceOut}];
  });
}

function evaluateViews3d(document: GraphicsDocument, layers: Layer[], time:number): Graphics3DView[] {
  const ids=new Set(layers.filter(layer=>layer.type==="3d-view"&&layer.view3dId).map(layer=>layer.view3dId as string));
  return (document.views3d??[]).filter(view=>ids.has(view.id)).map(view=>{
    const worldTime=map3DViewTime(time,view);
    return evaluate3DViewAtTime(view, document.timeline, worldTime);
  });
}

function renderTreeForLayers(document: GraphicsDocument, layers: Layer[]): RenderNode[] {
  return buildRenderTree({ ...document, layers });
}

/**
 * Evaluate one composition at a specific composition time.
 *
 * This is intentionally a pure function. The document remains the source of
 * truth; callers receive a render-ready snapshot for a single point in time.
 */
export function evaluateComposition(
  document: GraphicsDocument,
  compositionId: string,
  time = 0,
): CompositionEvaluation | undefined {
  const resolved = resolveComposition(document, compositionId);
  if (!resolved) return undefined;

  const layers = resolved.layers.map(layer => ({
    ...layer,
    style: layer.style ? { ...layer.style } : layer.style,
    textStyle: layer.textStyle ? { ...layer.textStyle } : layer.textStyle,
    viewportOverrides: layer.viewportOverrides ? { ...layer.viewportOverrides } : layer.viewportOverrides,
  }));
  const requestedTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  const duration = resolved.composition.duration;
  const safeTime = duration && duration > 0
    ? (resolved.composition.loop ? requestedTime % duration : Math.min(requestedTime, duration))
    : requestedTime;

  const animatedLayers = applyCompositionAnimation(resolved.composition, layers, safeTime);

  return {
    kind: "composition",
    composition: { ...resolved.composition },
    time: safeTime,
    timeDomain: { output: safeTime, composition: safeTime },
    layers: animatedLayers,
    renderTree: renderTreeForLayers(document, animatedLayers),
    videos: evaluateVideos(document, animatedLayers, safeTime),
    views3d: evaluateViews3d(document, animatedLayers, safeTime),
  };
}

/**
 * Evaluate the active scene at a presentation/document time.
 *
 * Scene selection remains the responsibility of the existing presentation
 * model. This function creates the common runtime snapshot that rendering can
 * consume without knowing how scenes or compositions are stored.
 */
export function evaluateScene(
  document: GraphicsDocument,
  time: number,
  viewportId?: string,
): SceneEvaluation | undefined {
  const resolved = resolveScene(document, time, viewportId);
  if (!resolved) return undefined;

  const layers = resolved.layers.map(layer => ({
    ...layer,
    style: layer.style ? { ...layer.style } : layer.style,
    textStyle: layer.textStyle ? { ...layer.textStyle } : layer.textStyle,
    viewportOverrides: layer.viewportOverrides ? { ...layer.viewportOverrides } : layer.viewportOverrides,
  }));
  const globalTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  const compositionTime = resolved.composition.duration && resolved.composition.duration > 0
    ? (resolved.composition.loop
      ? resolved.localTime % resolved.composition.duration
      : Math.min(resolved.localTime, resolved.composition.duration))
    : resolved.localTime;
  const animatedLayers = applyCompositionAnimation(resolved.composition, layers, compositionTime);

  return {
    kind: "scene",
    composition: { ...resolved.composition },
    scene: { ...resolved.scene },
    globalTime,
    localTime: compositionTime,
    time: compositionTime,
    timeDomain: { output: globalTime, composition: compositionTime },
    layers: animatedLayers,
    renderTree: renderTreeForLayers(document, animatedLayers),
    videos: evaluateVideos(document, animatedLayers, compositionTime),
    views3d: evaluateViews3d(document, animatedLayers, compositionTime),
  };
}

/**
 * Resolve a composition without evaluating it. Useful to callers that need
 * composition metadata before choosing a runtime time.
 */
export function compositionForEvaluation(
  document: GraphicsDocument,
  compositionId: string,
): ResolvedComposition | undefined {
  return resolveComposition(document, compositionId);
}

/**
 * Resolve a scene without constructing a render snapshot.
 *
 * Kept as a small companion API so editor code can distinguish document
 * resolution from runtime evaluation.
 */
export function sceneForEvaluation(
  document: GraphicsDocument,
  time: number,
  viewportId?: string,
): ResolvedScene | undefined {
  return resolveScene(document, time, viewportId);
}
