import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { getLayerBounds } from "../../layer-bounds";
import { CanvasLayerContent } from "./CanvasLayerContent";
import { LayerFrame } from "./LayerFrame";

export const CanvasLayer: FC<{
  layer: Layer;
  layers?: Layer[];
  selected: boolean;
  selectedIds?: Set<string>;
  multiSelected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onLayerPointerDown?: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onNodes?: (nodes: PathNode[]) => void;
  worlds3d?: Graphics3DWorld[];
  views3d?: Graphics3DView[];
}> = ({ layer, layers = [], selected, selectedIds = new Set(), multiSelected, onPointerDown, onLayerPointerDown, onSelectLayer, onNodes, worlds3d = [], views3d = [] }) => {
  const content = <CanvasLayerContent layer={layer} layers={layers} selected={selected} selectedIds={selectedIds} multiSelected={multiSelected} onPointerDown={onPointerDown} onLayerPointerDown={onLayerPointerDown} onSelectLayer={onSelectLayer} onNodes={onNodes} worlds3d={worlds3d} views3d={views3d} />;
  if (layer.type === "line" || layer.type === "path") return content;
  const frameLayer = layer.type === "group" ? { ...layer, ...(getLayerBounds(layers, layer.id) ?? {}), rotation: 0 } : layer;
  return <LayerFrame layer={layer} frameLayer={frameLayer} selected={selected} multiSelected={multiSelected} onPointerDown={onPointerDown}>{content}</LayerFrame>;
};
