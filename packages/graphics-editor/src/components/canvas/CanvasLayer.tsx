import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { HANDLE_LIST } from "../../constants";
import { anchor, layerStyle } from "../../geometry";
import type { Layer } from "../../types";

export const CanvasLayer: FC<{ layer: Layer; selected: boolean; onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void }> = ({ layer, selected, onPointerDown }) => (
  <div style={layerStyle(layer, selected)} onPointerDown={e => onPointerDown(e, "move")}>
    {layer.type === "text" && <div style={{ width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>{layer.text}</div>}
    {layer.type === "ellipse" && <div style={{ width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none" }} />}
    {layer.type === "rect" && <div style={{ width: "100%", height: "100%", pointerEvents: "none" }} />}
    {layer.type === "image" && <img src={layer.src || ""} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: String(layer.style?.["object-fit"] ?? "contain"), pointerEvents: "none" }} />}
    {selected && <SelectionHandles layer={layer} onPointerDown={onPointerDown} />}
  </div>
);

const SelectionHandles: FC<{ layer: Layer; onPointerDown: (event: ReactPointerEvent, kind: "resize" | "rotate", handle?: string) => void }> = ({ layer, onPointerDown }) => <>
  {HANDLE_LIST.map(handle => { const point = anchor(handle, layer); return <span key={handle} className="ge-handle" style={{ left: point.left, top: point.top, cursor: `${handle}-resize` }} onPointerDown={e => onPointerDown(e, "resize", handle)} />; })}
  <span className="ge-rotate" style={{ left: layer.width / 2, top: -32 }} onPointerDown={e => onPointerDown(e, "rotate")} />
</>;
