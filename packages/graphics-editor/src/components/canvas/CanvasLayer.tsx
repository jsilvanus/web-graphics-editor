import { useState, type FC, type PointerEvent as ReactPointerEvent } from "react";
import type {
  EvaluatedVideo,
  Graphics3DView,
  Graphics3DWorld,
  GraphicsAsset,
  Layer,
  PathNode,
  TextRun,
} from "../../types";
import type { RenderNode } from "../../render-model";
import { getLayerBounds } from "../../layer-bounds";
import { CanvasLayerContent } from "./CanvasLayerContent";
import { LayerFrame } from "./LayerFrame";

export const CanvasLayer: FC<{
  layer: Layer;
  layers?: Layer[];
  renderNode?: RenderNode;
  selected: boolean;
  selectedIds?: Set<string>;
  multiSelected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onLayerPointerDown?: (
    event: ReactPointerEvent,
    id: string,
    kind: "move" | "resize" | "rotate",
    handle?: string,
  ) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onNodes?: (nodes: PathNode[]) => void;
  onTextCommit?: (id: string, text: string) => void;
  onTextRunsCommit?: (id: string, runs: TextRun[] | undefined) => void;
  worlds3d?: Graphics3DWorld[];
  views3d?: Graphics3DView[];
  videos?: EvaluatedVideo[];
  assets?: GraphicsAsset[];
  currentTime?: number;
}> = ({
  layer,
  layers = [],
  renderNode,
  selected,
  selectedIds = new Set(),
  multiSelected,
  onPointerDown,
  onLayerPointerDown,
  onSelectLayer,
  onNodes,
  onTextCommit,
  onTextRunsCommit,
  worlds3d = [],
  views3d = [],
  videos = [],
  assets = [],
  currentTime = 0,
}) => {
  // Incremented on double-click; text layers enter edit mode when it changes.
  const [editRequest, setEditRequest] = useState(0);
  const content = (
    <CanvasLayerContent
      editRequest={editRequest}
      layer={layer}
      layers={layers}
      renderNode={renderNode}
      selected={selected}
      selectedIds={selectedIds}
      multiSelected={multiSelected}
      onPointerDown={onPointerDown}
      onLayerPointerDown={onLayerPointerDown}
      onSelectLayer={onSelectLayer}
      onNodes={onNodes}
      onTextCommit={onTextCommit}
      onTextRunsCommit={onTextRunsCommit}
      worlds3d={worlds3d}
      views3d={views3d}
      videos={videos}
      assets={assets}
      currentTime={currentTime}
    />
  );
  if (layer.type === "line" || layer.type === "path") return content;
  const frameLayer =
    layer.type === "group" ? { ...layer, ...(getLayerBounds(layers, layer.id) ?? {}), rotation: 0 } : layer;
  return (
    <LayerFrame
      layer={layer}
      frameLayer={frameLayer}
      selected={selected}
      multiSelected={multiSelected}
      onPointerDown={onPointerDown}
      onDoubleClick={layer.type === "text" && !layer.locked ? () => setEditRequest(n => n + 1) : undefined}
    >
      {content}
    </LayerFrame>
  );
};
