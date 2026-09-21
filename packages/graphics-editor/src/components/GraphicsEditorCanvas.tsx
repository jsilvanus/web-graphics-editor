import { useState, type FC, type PointerEvent as ReactPointerEvent, type RefObject, type WheelEvent as ReactWheelEvent } from "react";
import { WIDTH, HEIGHT } from "../constants";
import type { Graphics3DView, Graphics3DWorld, GraphicsAsset, Layer, PathNode, TextRun } from "../types";
import { CanvasLayerStack, CanvasSelectionOverlay } from "./canvas/CanvasLayerStack";
import type { CompositorFrame } from "../compositor";

export interface DrawingPreview { tool: "line" | "path" | "orthogonal" | "polygon" | "star" | "freehand"; points: Array<{ x: number; y: number }> }

const rulerStep = (zoom: number) => {
  const target = 100 / Math.max(zoom, 0.01);
  const steps = [10, 20, 50, 100, 200, 500, 1000];
  return steps.find(step => step >= target) ?? 1000;
};

export const GraphicsEditorCanvas: FC<{ frame?: CompositorFrame; marquee?: { x: number; y: number; width: number; height: number }; artboardRef: RefObject<HTMLDivElement | null>; layers: Layer[]; selectedIds: Set<string>; grid: boolean; safe: boolean; background: string; zoom?: number; panX?: number; panY?: number; viewportRef?: RefObject<HTMLDivElement | null>; onWheel?: (event: ReactWheelEvent) => void; onViewportPointerDown?: (event: ReactPointerEvent) => void; onViewportPointerMove?: (event: ReactPointerEvent) => void; onViewportPointerUp?: () => void; onFit?: () => void; onZoomIn?: () => void; onZoomOut?: () => void; onZoomReset?: () => void; onPointerMove: (event: ReactPointerEvent) => void; onPointerUp: () => void; onCanvasPointerDown: (event: ReactPointerEvent) => void; onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void; onSelectLayer?: (id: string, additive?: boolean) => void; onPathNodes?: (id: string, nodes: PathNode[]) => void; onTextCommit?: (id: string, text: string) => void; onTextRunsCommit?: (id: string, runs: TextRun[] | undefined) => void; drawing?: DrawingPreview | null; onDrawingDoubleClick?: () => void; worlds3d?: Graphics3DWorld[]; views3d?: Graphics3DView[]; assets?: GraphicsAsset[]; currentTime?: number }> = ({ artboardRef, frame, layers, selectedIds, grid, safe, background, zoom = 1, panX = 0, panY = 0, viewportRef, onWheel, onViewportPointerDown, onViewportPointerMove, onViewportPointerUp, onFit, onZoomIn, onZoomOut, onZoomReset, onPointerMove, onPointerUp, onCanvasPointerDown, onLayerPointerDown, onSelectLayer, onPathNodes, onTextCommit, onTextRunsCommit, drawing, onDrawingDoubleClick, worlds3d = [], views3d = [], assets = [], currentTime = 0 }) => {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const step = rulerStep(zoom);
  const ticks = Array.from({ length: Math.ceil(WIDTH / step) + 2 }, (_, i) => i * step);
  const yticks = Array.from({ length: Math.ceil(HEIGHT / step) + 2 }, (_, i) => i * step);
  const handleMove = (event: ReactPointerEvent) => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (rect) setCursor({ x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom });
    onPointerMove(event);
  };
  return <div className="ge-canvas-wrap">
    <div className="ge-viewport" ref={viewportRef} onWheel={onWheel} onPointerDown={onViewportPointerDown} onPointerMove={onViewportPointerMove} onPointerUp={onViewportPointerUp} style={{ position: "relative", overflow: "hidden", touchAction: "none" }}>
      <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 28, height: 22, zIndex: 900, background: "#171717", borderRight: "1px solid #444", borderBottom: "1px solid #444" }} />
      <div aria-hidden="true" style={{ position: "absolute", left: 28, right: 0, top: 0, height: 22, zIndex: 899, overflow: "hidden", background: "#171717", borderBottom: "1px solid #444", color: "#aaa", fontSize: 9, pointerEvents: "none" }}>{ticks.map(x => <span key={x} style={{ position: "absolute", left: 28 + panX + x * zoom, top: 4, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{x}</span>)}</div>
      <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 22, bottom: 0, width: 28, zIndex: 899, overflow: "hidden", background: "#171717", borderRight: "1px solid #444", color: "#aaa", fontSize: 9, pointerEvents: "none" }}>{yticks.map(y => <span key={y} style={{ position: "absolute", left: 3, top: 22 + panY + y * zoom, transform: "translateY(-50%)", whiteSpace: "nowrap" }}>{y}</span>)}</div>
      <div className="ge-viewport-controls" style={{ position: "absolute", right: 8, top: 8, zIndex: 1000, display: "flex", gap: 4 }}>
        <button onClick={onZoomOut} type="button" title="Zoom out">−</button><button onClick={onZoomReset} type="button" title="100%">100%</button><span style={{ padding: "4px 7px", background: "#222", color: "#fff", fontSize: 12 }}>{Math.round(zoom * 100)}%</span><button onClick={onZoomIn} type="button" title="Zoom in">+</button><button onClick={onFit} type="button" title="Fit canvas">Fit</button>
      </div>
      <div className="ge-canvas" style={{ position: "absolute", inset: "22px 0 0 28px" }} onPointerMove={handleMove} onPointerUp={onPointerUp} onPointerLeave={() => { setCursor(null); onPointerUp(); }}>
        <div ref={artboardRef} className="ge-artboard" onPointerDown={onCanvasPointerDown} style={{ background, transform: `translate(${panX}px,${panY}px) scale(${zoom})`, transformOrigin: "0 0" }}>
          {grid && <div className="ge-grid" />}<div className="ge-guide ge-guide-v" /><div className="ge-guide ge-guide-h" />
          <CanvasLayerStack layers={layers} frame={frame} selectedIds={selectedIds} worlds3d={worlds3d} views3d={views3d} assets={assets} currentTime={currentTime} onLayerPointerDown={onLayerPointerDown} onSelectLayer={onSelectLayer} onPathNodes={onPathNodes} onTextCommit={onTextCommit} onTextRunsCommit={onTextRunsCommit} />
          {drawing && drawing.points.length > 0 && <svg className="ge-drawing-preview" width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200 }} onDoubleClick={onDrawingDoubleClick}><polyline points={drawing.points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" />{drawing.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#38bdf8" strokeWidth="3" />)}</svg>}
          <CanvasSelectionOverlay layers={frame?.layers ?? layers} selectedIds={selectedIds} onPointerDown={onLayerPointerDown} />
          {marquee && <div aria-label="Selection marquee" style={{ position: "absolute", left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height, border: "1px dashed #38bdf8", background: "rgba(56,189,248,.12)", pointerEvents: "none", zIndex: 400, boxSizing: "border-box" }} />}
          {safe && <><div className="ge-safe safe90" /><div className="ge-safe safe80" /></>}
        </div>
      </div>
      <div className="ge-canvas-status" aria-live="polite" style={{ position: "absolute", left: 36, bottom: 8, zIndex: 1001, padding: "3px 7px", borderRadius: 3, background: "rgba(20,20,20,.85)", color: "#aaa", fontSize: 11, pointerEvents: "none" }}>{cursor ? `X ${Math.round(cursor.x)}  Y ${Math.round(cursor.y)}` : "Move over canvas"} · {Math.round(zoom * 100)}%</div>
    </div>
  </div>;
};

export const canvasAspectRatio = `${WIDTH}/${HEIGHT}`;
