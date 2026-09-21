import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, GraphicsAsset, Layer, PathNode, TextRun } from "../../types";
import { getRootLayers } from "../../layer-tree";
import { CanvasLayer } from "./CanvasLayer";
import { CanvasSelectionOverlay } from "./SelectionOverlay";
import type { CompositorFrame } from "../../compositor";

export interface CanvasLayerStackProps { layers: Layer[]; frame?: CompositorFrame; selectedIds: Set<string>; worlds3d: Graphics3DWorld[]; views3d: Graphics3DView[]; assets?: GraphicsAsset[]; currentTime?: number; onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void; onSelectLayer?: (id: string, additive?: boolean) => void; onPathNodes?: (id: string, nodes: PathNode[]) => void; onTextCommit?: (id: string, text: string) => void; onTextRunsCommit?: (id: string, runs: TextRun[] | undefined) => void }

export const CanvasLayerStack: FC<CanvasLayerStackProps> = ({ layers, frame, selectedIds, worlds3d, views3d, assets = [], currentTime = 0, onLayerPointerDown, onSelectLayer, onPathNodes, onTextCommit, onTextRunsCommit }) => (
  <>{getRootLayers(frame?.layers ?? layers).map(layer => <CanvasLayer key={layer.id} layer={layer} renderNode={frame?.renderTree.find(node => node.layer.id === layer.id)} layers={frame?.layers ?? layers} selected={selectedIds.has(layer.id)} selectedIds={selectedIds} multiSelected={selectedIds.size > 1} worlds3d={worlds3d} views3d={frame?.views3d ?? views3d} videos={frame?.videos ?? []} assets={assets} currentTime={frame?.time ?? currentTime} onSelectLayer={onSelectLayer} onPointerDown={(event, kind, handle) => onLayerPointerDown(event, layer.id, kind, handle)} onLayerPointerDown={onLayerPointerDown} onNodes={nodes => onPathNodes?.(layer.id, nodes)} onTextCommit={onTextCommit} onTextRunsCommit={onTextRunsCommit} />)}</>
);

export { CanvasSelectionOverlay } from "./SelectionOverlay";
