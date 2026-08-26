import type { FC, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { HANDLE_LIST } from "../constants";
import { anchor, layerStyle } from "../geometry";
import type { Layer } from "../types";

export const GraphicsEditorCanvas: FC<{
  artboardRef: RefObject<HTMLDivElement | null>;
  layers: Layer[]; selectedIds: Set<string>; grid: boolean; safe: boolean; background: string;
  onPointerMove: (event: ReactPointerEvent) => void; onPointerUp: () => void;
  onCanvasPointerDown: () => void;
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: string, handle?: string) => void;
}> = ({ artboardRef, layers, selectedIds, grid, safe, background, onPointerMove, onPointerUp, onCanvasPointerDown, onLayerPointerDown }) => (
  <div className="ge-canvas-wrap">
    <div className="ge-canvas" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onPointerDown={onCanvasPointerDown}>
      <div ref={artboardRef} className="ge-artboard" style={{ background }}>
        {grid && <div className="ge-grid" />}
        {layers.map(layer => <div key={layer.id} style={layerStyle(layer, selectedIds.has(layer.id))} onPointerDown={event => onLayerPointerDown(event, layer.id, "move")}>
          {layer.type === "text" && <div style={{ width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>{layer.text}</div>}
          {layer.type === "ellipse" && <div style={{ width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none" }} />}
          {layer.type === "rect" && <div style={{ width: "100%", height: "100%", pointerEvents: "none" }} />}
          {layer.type === "image" && <img src={layer.src || ""} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />}
          {selectedIds.has(layer.id) && <>{HANDLE_LIST.map(handle => { const point = anchor(handle, layer); return <span key={handle} className="ge-handle" style={{ left: point.left, top: point.top, cursor: `${handle}-resize` }} onPointerDown={event => onLayerPointerDown(event, layer.id, "resize", handle)} />; })}<span className="ge-rotate" style={{ left: layer.width / 2, top: -32 }} onPointerDown={event => onLayerPointerDown(event, layer.id, "rotate")} /></>}
        </div>)}
        {safe && <><div className="ge-safe safe90" /><div className="ge-safe safe80" /></>}
      </div>
    </div>
  </div>
);
