import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { getRootLayers } from "../../layer-tree";
import { CanvasLayer } from "./CanvasLayer";

export interface CanvasLayerStackProps {
  layers: Layer[];
  selectedIds: Set<string>;
  worlds3d: Graphics3DWorld[];
  views3d: Graphics3DView[];
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
}

export const CanvasLayerStack: FC<CanvasLayerStackProps> = ({ layers, selectedIds, worlds3d, views3d, onLayerPointerDown, onPathNodes }) => (
  <>{getRootLayers(layers).map(layer => (
    <CanvasLayer
      key={layer.id}
      layer={layer}
      layers={layers}
      selected={selectedIds.has(layer.id)}
      selectedIds={selectedIds}
      multiSelected={selectedIds.size > 1}
      worlds3d={worlds3d}
      views3d={views3d}
      onPointerDown={(event, kind, handle) => onLayerPointerDown(event, layer.id, kind, handle)}
      onLayerPointerDown={onLayerPointerDown}
      onNodes={nodes => onPathNodes?.(layer.id, nodes)}
    />
  ))}</>
);
