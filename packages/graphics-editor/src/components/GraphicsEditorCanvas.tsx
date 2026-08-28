import type { FC, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { WIDTH, HEIGHT } from "../constants";
import type { Layer } from "../types";
import { CanvasLayer } from "./canvas/CanvasLayer";
import { SelectionOverlay } from "./canvas/SelectionOverlay";

export interface DrawingPreview {
  tool: "line" | "path" | "orthogonal";
  points: Array<{ x: number; y: number }>;
}

export const GraphicsEditorCanvas: FC<{
  artboardRef: RefObject<HTMLDivElement | null>; layers: Layer[]; selectedIds: Set<string>; grid: boolean; safe: boolean; background: string;
  onPointerMove: (event: ReactPointerEvent) => void; onPointerUp: () => void; onCanvasPointerDown: (event: ReactPointerEvent) => void;
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  drawing?: DrawingPreview | null;
  onDrawingPointerDown?: (event: ReactPointerEvent) => void;
  onDrawingDoubleClick?: () => void;
}> = ({ artboardRef, layers, selectedIds, grid, safe, background, onPointerMove, onPointerUp, onCanvasPointerDown, onLayerPointerDown, drawing, onDrawingPointerDown, onDrawingDoubleClick }) => <div className="ge-canvas-wrap">
  <div className="ge-canvas" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onPointerDown={onCanvasPointerDown}>
    <div ref={artboardRef} className="ge-artboard" style={{ background }}>
      {grid && <div className="ge-grid" />}
      {layers.map(layer => <CanvasLayer key={layer.id} layer={layer} selected={selectedIds.has(layer.id)} onPointerDown={(event, kind, handle) => onLayerPointerDown(event, layer.id, kind, handle)} />)}
      {drawing && drawing.points.length > 0 && <svg className="ge-drawing-preview" width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200 }}>
        <polyline points={drawing.points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" />
        {drawing.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#38bdf8" strokeWidth="3" />)}
      </svg>}
      <SelectionOverlay layers={layers} selectedIds={selectedIds} />
      {safe && <><div className="ge-safe safe90" /><div className="ge-safe safe80" /></>}
    </div>
  </div>
</div>;

export const canvasAspectRatio = `${WIDTH}/${HEIGHT}`;
