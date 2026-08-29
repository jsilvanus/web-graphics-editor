import type { FC, PointerEvent as ReactPointerEvent, RefObject, WheelEvent as ReactWheelEvent } from "react";
import { WIDTH, HEIGHT } from "../constants";
import type { Graphics3DView, Graphics3DWorld, Layer, PathNode } from "../types";
import { CanvasLayerStack, CanvasSelectionOverlay } from "./canvas/CanvasLayerStack";

export interface DrawingPreview { tool: "line" | "path" | "orthogonal"; points: Array<{ x: number; y: number }> }

export const GraphicsEditorCanvas: FC<{
  artboardRef: RefObject<HTMLDivElement | null>;
  layers: Layer[];
  selectedIds: Set<string>;
  grid: boolean;
  safe: boolean;
  background: string;
  zoom?: number;
  panX?: number;
  panY?: number;
  viewportRef?: RefObject<HTMLDivElement | null>;
  onWheel?: (event: ReactWheelEvent) => void;
  onViewportPointerDown?: (event: ReactPointerEvent) => void;
  onViewportPointerMove?: (event: ReactPointerEvent) => void;
  onViewportPointerUp?: () => void;
  onFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onCanvasPointerDown: (event: ReactPointerEvent) => void;
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onSelectLayer?: (id: string, additive?: boolean) => void;
  onPathNodes?: (id: string, nodes: PathNode[]) => void;
  drawing?: DrawingPreview | null;
  onDrawingDoubleClick?: () => void;
  worlds3d?: Graphics3DWorld[];
  views3d?: Graphics3DView[];
}> = ({
  artboardRef, layers, selectedIds, grid, safe, background,
  zoom = 1, panX = 0, panY = 0, viewportRef,
  onWheel, onViewportPointerDown, onViewportPointerMove, onViewportPointerUp,
  onFit, onZoomIn, onZoomOut, onPointerMove, onPointerUp, onCanvasPointerDown,
  onLayerPointerDown, onSelectLayer, onPathNodes, drawing, onDrawingDoubleClick,
  worlds3d = [], views3d = [],
}) => (
  <div className="ge-canvas-wrap">
    <div className="ge-viewport" ref={viewportRef} onWheel={onWheel} onPointerDown={onViewportPointerDown} onPointerMove={onViewportPointerMove} onPointerUp={onViewportPointerUp} style={{ position: "relative", overflow: "hidden", touchAction: "none" }}>
      <div className="ge-viewport-controls" style={{ position: "absolute", right: 8, top: 8, zIndex: 1000, display: "flex", gap: 4 }}>
        <button onClick={onZoomOut} type="button">−</button><span style={{ padding: "4px 7px", background: "#222", color: "#fff", fontSize: 12 }}>{Math.round(zoom * 100)}%</span><button onClick={onZoomIn} type="button">+</button><button onClick={onFit} type="button">Fit</button>
      </div>
      <div className="ge-canvas" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div ref={artboardRef} className="ge-artboard" onPointerDown={onCanvasPointerDown} style={{ background, transform: `translate(${panX}px,${panY}px) scale(${zoom})`, transformOrigin: "0 0" }}>
          {grid && <div className="ge-grid" />}<div className="ge-guide ge-guide-v" /><div className="ge-guide ge-guide-h" />
          <CanvasLayerStack layers={layers} selectedIds={selectedIds} worlds3d={worlds3d} views3d={views3d} onLayerPointerDown={onLayerPointerDown} onSelectLayer={onSelectLayer} onPathNodes={onPathNodes} />
          {drawing && drawing.points.length > 0 && <svg className="ge-drawing-preview" width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200 }} onDoubleClick={onDrawingDoubleClick}><polyline points={drawing.points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" />{drawing.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#38bdf8" strokeWidth="3" />)}</svg>}
          <CanvasSelectionOverlay layers={layers} selectedIds={selectedIds} onPointerDown={onLayerPointerDown} />
          {safe && <><div className="ge-safe safe90" /><div className="ge-safe safe80" /></>}
        </div>
      </div>
    </div>
  </div>
);

export const canvasAspectRatio = `${WIDTH}/${HEIGHT}`;
