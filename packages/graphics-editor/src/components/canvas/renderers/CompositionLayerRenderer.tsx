import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode, TextRun } from "../../../types";
import type { RenderNode } from "../../../render-model";
import { CanvasLayer } from "../CanvasLayer";

export interface CompositionLayerRendererProps {
  node: RenderNode;
  selectedIds: Set<string>;
  worlds3d: Graphics3DWorld[];
  views3d: Graphics3DView[];
  currentTime?: number;
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
  onTextCommit?: (id: string, text: string) => void;
  onTextRunsCommit?: (id: string, runs: TextRun[] | undefined) => void;
}

export const CompositionLayerRenderer: FC<CompositionLayerRendererProps> = ({
  node, selectedIds, worlds3d, views3d, currentTime = 0, onLayerPointerDown, onSelectLayer, onPathNodes, onTextCommit, onTextRunsCommit,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible", opacity: node.opacity }}>
      {node.children.map(child => (
        <CanvasLayer
          key={child.layer.id}
          layer={child.layer}
          renderNode={child}
          layers={flattenNodes(node.children)}
          selected={selectedIds.has(child.layer.id)}
          selectedIds={selectedIds}
          multiSelected={selectedIds.size > 1}
          worlds3d={worlds3d}
          views3d={views3d}
          currentTime={currentTime}
          onPointerDown={(event, kind, handle) => {
            event.stopPropagation();
            onSelectLayer?.(child.layer.id, event.shiftKey);
            onLayerPointerDown(event, child.layer.id, kind, handle);
          }}
          onLayerPointerDown={onLayerPointerDown}
          onSelectLayer={onSelectLayer}
          onNodes={nodes => onPathNodes?.(child.layer.id, nodes)}
          onTextCommit={onTextCommit}
          onTextRunsCommit={onTextRunsCommit}
        />
      ))}
    </div>
  );
};

function flattenNodes(nodes: RenderNode[]): Layer[] {
  return nodes.flatMap(node => [node.layer, ...flattenNodes(node.children)]);
}
