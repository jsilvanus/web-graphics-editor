import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { WIDTH, HEIGHT } from "../../constants";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { CanvasLayer } from "./CanvasLayer";
import { SelectionOverlay } from "./SelectionOverlay";

export interface CanvasLayerStackProps {
  layers: Layer[];
  selectedIds: Set<string>;
  worlds3d: Graphics3DWorld[];
  views3d: Graphics3DView[];
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
}

/** Owns the 2D composition order: document layers are painted in array order. */
export const CanvasLayerStack: FC<CanvasLayerStackProps> = ({ layers, selectedIds, worlds3d, views3d, onLayerPointerDown, onPathNodes }) => (
  <>
    {layers.map(layer => (
      <CanvasLayer
        key={layer.id}
        layer={layer}
        selected={selectedIds.has(layer.id)}
        multiSelected={selectedIds.size > 1}
        worlds3d={worlds3d}
        views3d={views3d}
        onPointerDown={(event, kind, handle) => onLayerPointerDown(event, layer.id, kind, handle)}
        onNodes={nodes => onPathNodes?.(layer.id, nodes)}
      />
    ))}
  </>
);

export function CanvasSelectionOverlay({ layers, selectedIds, onPointerDown }: Pick<CanvasLayerStackProps, "layers" | "selectedIds"> & { onPointerDown: CanvasLayerStackProps["onLayerPointerDown"] }) {
  return <SelectionOverlay layers={layers} selectedIds={selectedIds} onPointerDown={(event, kind, handle) => {
    const id = [...selectedIds][0];
    if (id) onPointerDown(event, id, kind, handle);
  }} />;
}

export const canvasOverlaySize = { width: WIDTH, height: HEIGHT };
