import type { ReactNode } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../../types";
import { ImageLayerRenderer } from "./renderers/ImageLayerRenderer";
import { ShapeLayerRenderer } from "./renderers/ShapeLayerRenderer";
import { TextLayerRenderer } from "./renderers/TextLayerRenderer";
import { VectorLayer } from "./VectorLayer";
import { ThreeDViewLayer } from "./ThreeDViewLayer";
import { GroupLayerRenderer } from "./GroupLayerRenderer";

export interface CanvasLayerContentProps {
  layer: Layer;
  layers?: Layer[];
  selected: boolean;
  selectedIds?: Set<string>;
  multiSelected: boolean;
  onPointerDown: (event: React.PointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onNodes?: (nodes: PathNode[]) => void;
  worlds3d?: Graphics3DWorld[];
  views3d?: Graphics3DView[];
}

export function CanvasLayerContent({ layer, layers = [], selected, selectedIds = new Set(), multiSelected, onPointerDown, onNodes, worlds3d = [], views3d = [] }: CanvasLayerContentProps): ReactNode {
  if (layer.type === "group") return <GroupLayerRenderer layer={layer} layers={layers} selectedIds={selectedIds} worlds3d={worlds3d} views3d={views3d} onLayerPointerDown={onPointerDown} onPathNodes={(id, nodes) => onNodes?.(nodes)} />;
  if (layer.type === "3d-view") {
    const view = views3d.find(item => item.id === layer.view3dId);
    const world = view && worlds3d.find(item => item.id === view.worldId);
    return view && world ? <ThreeDViewLayer layer={layer} view={view} world={world} /> : null;
  }
  if (layer.type === "line" || layer.type === "path") return <VectorLayer layer={layer} selected={selected} multiSelected={multiSelected} onPointerDown={onPointerDown} onNodes={onNodes} />;
  if (layer.type === "text") return <TextLayerRenderer layer={layer} />;
  if (layer.type === "image") return <ImageLayerRenderer layer={layer} />;
  if (layer.type === "rectangle" || layer.type === "ellipse") return <ShapeLayerRenderer layer={layer} />;
  return null;
}
