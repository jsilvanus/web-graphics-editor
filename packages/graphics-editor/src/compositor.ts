import type { GraphicsDocument, GraphicsOutput, Graphics3DView, EvaluationTime, Layer } from "./types";
import {
  evaluateComposition,
  evaluateScene,
  type CompositionEvaluation,
  type SceneEvaluation,
} from "./composition-evaluator";
import type { RenderNode } from "./render-model";

export interface CompositorFrame {
  kind: "composition" | "scene";
  compositionId: string;
  time: number;
  timeDomain: EvaluationTime;
  layers: Layer[];
  renderTree: RenderNode[];
  videos: CompositionEvaluation["videos"];
  views3d: Graphics3DView[];
  evaluation: CompositionEvaluation | SceneEvaluation;
}

export function composeDocumentAtTime(
  document: GraphicsDocument,
  time = 0,
  viewportId?: string,
): CompositorFrame | undefined {
  const evaluation = document.timeline?.scenes.length
    ? evaluateScene(document, time, viewportId)
    : (() => {
        const viewport = document.viewports?.find(view => view.id === viewportId);
        const compositionId = viewport?.compositionIds?.[0] ?? document.compositions?.[0]?.id;
        return compositionId ? evaluateComposition(document, compositionId, time) : undefined;
      })();

  if (!evaluation) return undefined;

  return {
    kind: evaluation.kind,
    compositionId: evaluation.composition.id,
    time: evaluation.time,
    timeDomain: evaluation.timeDomain,
    layers: evaluation.layers,
    renderTree: evaluation.renderTree,
    videos: evaluation.videos,
    views3d: evaluation.views3d,
    evaluation,
  };
}

export function composeOutput(
  document: GraphicsDocument,
  output: GraphicsOutput,
  time = 0,
): CompositorFrame | undefined {
  return composeDocumentAtTime(document, time, output.viewportId);
}
