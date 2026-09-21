import type { Composition, GraphicsDocument, Layer, Scene } from "./types";
import { buildRenderTree, type RenderNode } from "./render-model";
import { resolveComposition, resolveScene, type ResolvedComposition, type ResolvedScene } from "./presentation";

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
  layers: Layer[];
  renderTree: RenderNode[];
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

  const layers = resolved.layers.map(layer => ({ ...layer }));
  const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;

  return {
    kind: "composition",
    composition: { ...resolved.composition },
    time: safeTime,
    layers,
    renderTree: renderTreeForLayers(document, layers),
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

  const layers = resolved.layers.map(layer => ({ ...layer }));
  const globalTime = Number.isFinite(time) ? Math.max(0, time) : 0;

  return {
    kind: "scene",
    composition: { ...resolved.composition },
    scene: { ...resolved.scene },
    globalTime,
    localTime: resolved.localTime,
    time: resolved.localTime,
    layers,
    renderTree: renderTreeForLayers(document, layers),
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
