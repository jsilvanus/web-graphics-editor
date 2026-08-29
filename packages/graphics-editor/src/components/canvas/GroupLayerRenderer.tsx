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
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
}

export const GroupLayerRenderer: FC<GroupLayerRendererProps> = ({ layer, layers, selectedIds, worlds3d, views3d, onLayerPointerDown, onSelectLayer, onPathNodes }) => {
  const children = getChildLayers(layers, layer.id);
  const bounds = getLayerBounds(layers, layer.id);
  const originX = bounds?.x ?? layer.x;
  const originY = bounds?.y ?? layer.y;
  const childPointerDown = (event: ReactPointerEvent, child: Layer, kind: "move" | "resize" | "rotate", handle?: string) => {
    if (event.altKey && kind === "move") {
      onSelectLayer?.(layer.id, event.shiftKey);
      onLayerPointerDown(event, layer.id, kind, handle);
      return;
    }
    onSelectLayer?.(child.id, event.shiftKey);
    onLayerPointerDown(event, child.id, kind, handle);
  };
  return (
    <div style={{ position: "absolute", left: -originX, top: -originY, width: "100vw", height: "100vh", overflow: "visible" }}>
      {children.map(child => (
        <CanvasLayer key={child.id} layer={child} layers={layers} selected={selectedIds.has(child.id)} selectedIds={selectedIds} multiSelected={selectedIds.size > 1} worlds3d={worlds3d} views3d={views3d} onPointerDown={(event, kind, handle) => childPointerDown(event, child, kind, handle)} onLayerPointerDown={onLayerPointerDown} onSelectLayer={onSelectLayer} onNodes={nodes => onPathNodes?.(child.id, nodes)} />
      ))}
    </div>
  );
};
