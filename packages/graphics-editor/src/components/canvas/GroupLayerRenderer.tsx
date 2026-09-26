import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { getChildLayers } from "../../layer-tree";
import { getLayerBounds } from "../../layer-bounds";
import { CanvasLayer } from "./CanvasLayer";

export interface GroupLayerRendererProps {
  layer: Layer;
  layers: Layer[];
  selectedIds: Set<string>;
  worlds3d: Graphics3DWorld[];
  views3d: Graphics3DView[];
  currentTime?: number;
  onLayerPointerDown: (
    event: ReactPointerEvent,
    id: string,
    kind: "move" | "resize" | "rotate",
    handle?: string,
  ) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
}

export const GroupLayerRenderer: FC<GroupLayerRendererProps> = ({
  layer,
  layers,
  selectedIds,
  worlds3d,
  views3d,
  currentTime = 0,
  onLayerPointerDown,
  onSelectLayer,
  onPathNodes,
}) => {
  const children = getChildLayers(layers, layer.id);
  const bounds = getLayerBounds(layers, layer.id);
  const originX = bounds?.x ?? layer.x;
  const originY = bounds?.y ?? layer.y;
  const childPointerDown = (
    event: ReactPointerEvent,
    child: Layer,
    kind: "move" | "resize" | "rotate",
    handle?: string,
  ) => {
    event.stopPropagation();
    if (event.altKey && kind === "move") {
      onSelectLayer?.(layer.id, event.shiftKey);
      onLayerPointerDown(event, layer.id, kind, handle);
      return;
    }
    onSelectLayer?.(child.id, event.shiftKey);
    onLayerPointerDown(event, child.id, kind, handle);
  };
  return (
    <div
      style={{
        position: "absolute",
        left: -originX,
        top: -originY,
        // Zero-size: positions children in document space without adding a hit area of its own
        // (a full-size box here swallowed clicks on empty canvas and dragged the group).
        width: 0,
        height: 0,
        overflow: "visible",
      }}
    >
      {children.map(child => (
        <CanvasLayer
          key={child.id}
          layer={child}
          layers={layers}
          selected={selectedIds.has(child.id)}
          selectedIds={selectedIds}
          multiSelected={selectedIds.size > 1}
          worlds3d={worlds3d}
          views3d={views3d}
          currentTime={currentTime}
          onPointerDown={(event, kind, handle) => childPointerDown(event, child, kind, handle)}
          onLayerPointerDown={onLayerPointerDown}
          onSelectLayer={onSelectLayer}
          onNodes={nodes => onPathNodes?.(child.id, nodes)}
        />
      ))}
    </div>
  );
};
