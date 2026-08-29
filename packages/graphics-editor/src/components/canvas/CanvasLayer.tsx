import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { CanvasLayerContent } from "./CanvasLayerContent";
import { LayerFrame } from "./LayerFrame";

export const CanvasLayer: FC<{
  layer: Layer;
  layers?: Layer[];
  selected: boolean;
  selectedIds?: Set<string>;
  multiSelected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onNodes?: (nodes: PathNode[]) => void;
  worlds3d?: Graphics3DWorld[];
  views3d?: Graphics3DView[];
}> = ({ layer, layers = [], selected, selectedIds = new Set(), multiSelected, onPointerDown, onNodes, worlds3d = [], views3d = [] }) => {
  const content = <CanvasLayerContent layer={layer} layers={layers} selected={selected} selectedIds={selectedIds} multiSelected={multiSelected} onPointerDown={onPointerDown} onNodes={onNodes} worlds3d={worlds3d} views3d={views3d} />;
  if (layer.type === "line" || layer.type === "path") return content;
  return <LayerFrame layer={layer} selected={selected} multiSelected={multiSelected} onPointerDown={onPointerDown}>{content}</LayerFrame>;
};
