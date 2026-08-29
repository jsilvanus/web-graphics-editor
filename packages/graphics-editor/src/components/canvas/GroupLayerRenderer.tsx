import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { getChildLayers } from "../../layer-tree";
import { CanvasLayer } from "./CanvasLayer";

export interface GroupLayerRendererProps {
  layer: Layer;
  layers: Layer[];
  selectedIds: Set<string>;
  worlds3d: Graphics3DWorld[];
  views3d: Graphics3DView[];
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
}

/** Composes children in document coordinates inside the group's transform/opacity frame. */
export const GroupLayerRenderer: FC<GroupLayerRendererProps> = ({ layer, layers, selectedIds, worlds3d, views3d, onLayerPointerDown, onPathNodes }) => {
  const children = getChildLayers(layers, layer.id);
  return (
    <div style={{ position: "absolute", left: -layer.x, top: -layer.y, width: "100vw", height: "100vh", overflow: "visible" }}>
      {children.map(child => (
        <CanvasLayer
          key={child.id}
          layer={child}
          selected={selectedIds.has(child.id)}
          multiSelected={selectedIds.size > 1}
          worlds3d={worlds3d}
          views3d={views3d}
          onPointerDown={(event, kind, handle) => onLayerPointerDown(event, child.id, kind, handle)}
          onNodes={nodes => onPathNodes?.(child.id, nodes)}
        />
      ))}
    </div>
  );
};
