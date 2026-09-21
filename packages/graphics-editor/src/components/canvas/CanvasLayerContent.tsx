import type { ReactNode } from "react";
import type { EvaluatedVideo, Graphics3DView, Graphics3DWorld, GraphicsAsset, Layer, PathNode, TextRun } from "../../types";
import type { RenderNode } from "../../render-model";
import { ImageLayerRenderer } from "./renderers/ImageLayerRenderer";
import { VideoLayerRenderer } from "./renderers/VideoLayerRenderer";
import { CompositionLayerRenderer } from "./renderers/CompositionLayerRenderer";
import { ShapeLayerRenderer } from "./renderers/ShapeLayerRenderer";
import { TextLayerRenderer } from "./renderers/TextLayerRenderer";
import { VectorLayer } from "./VectorLayer";
import { ThreeDViewLayer } from "./ThreeDViewLayer";
import { GroupLayerRenderer } from "./GroupLayerRenderer";

export interface CanvasLayerContentProps { layer: Layer; layers?: Layer[]; renderNode?: RenderNode; selected: boolean; selectedIds?: Set<string>; multiSelected: boolean; onPointerDown: (event: React.PointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void; onLayerPointerDown?: (event: React.PointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void; onSelectLayer?: (id: string, additive?: boolean) => void; onNodes?: (nodes: PathNode[]) => void; onTextCommit?: (id: string, text: string) => void; onTextRunsCommit?: (id: string, runs: TextRun[] | undefined) => void; worlds3d?: Graphics3DWorld[]; views3d?: Graphics3DView[]; videos?: EvaluatedVideo[]; assets?: GraphicsAsset[]; currentTime?: number }

export function CanvasLayerContent({ layer, layers = [], renderNode, selected, selectedIds = new Set(), multiSelected, onPointerDown, onLayerPointerDown, onSelectLayer, onNodes, onTextCommit, onTextRunsCommit, worlds3d = [], views3d = [], videos = [], assets = [], currentTime = 0 }: CanvasLayerContentProps): ReactNode {
  if (layer.type === "composition" && renderNode) return <CompositionLayerRenderer node={renderNode} selectedIds={selectedIds} worlds3d={worlds3d} views3d={views3d} currentTime={currentTime} onLayerPointerDown={onLayerPointerDown ?? (() => undefined)} onSelectLayer={onSelectLayer} onPathNodes={onNodes ? (id, nodes) => onNodes(nodes) : undefined} onTextCommit={onTextCommit} onTextRunsCommit={onTextRunsCommit} />;
  if (layer.type === "video") {
    const evaluated = videos.find(video => video.layerId === layer.id);
    const asset = evaluated && assets.find(item => item.id === evaluated.assetId);
    return asset ? <VideoLayerRenderer src={asset.url} mediaTime={evaluated?.mediaTime ?? 0}  /> : null;
  }
  if (layer.type === "group") return <GroupLayerRenderer layer={layer} layers={layers} selectedIds={selectedIds} worlds3d={worlds3d} views3d={views3d} currentTime={currentTime} onLayerPointerDown={onLayerPointerDown ?? (() => undefined)} onSelectLayer={onSelectLayer} onPathNodes={onNodes ? (id, nodes) => onNodes(nodes) : undefined} />;
  if (layer.type === "3d-view") { const view = views3d.find(item => item.id === layer.view3dId); const world = view && worlds3d.find(item => item.id === view.worldId); return view && world ? <ThreeDViewLayer layer={layer} view={view} world={world} currentTime={currentTime} /> : null; }
  if (layer.type === "line" || layer.type === "path") return <VectorLayer layer={layer} selected={selected} multiSelected={multiSelected} onPointerDown={onPointerDown} onNodes={onNodes} />;
  if (layer.type === "text") return <TextLayerRenderer layer={layer} layers={layers} onTextCommit={text => onTextCommit?.(layer.id, text)} onTextRunsCommit={runs => onTextRunsCommit?.(layer.id, runs)} />;
  if (layer.type === "image") return <ImageLayerRenderer layer={layer} />;
  if (layer.type === "rectangle" || layer.type === "ellipse") return <ShapeLayerRenderer layer={layer} />;
  return null;
}
