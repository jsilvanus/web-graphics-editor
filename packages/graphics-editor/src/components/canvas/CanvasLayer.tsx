import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import type { Layer } from "../../types";

export const CanvasLayer: FC<{ layer: Layer; selected: boolean; onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void }> = ({ layer, selected, onPointerDown }) => <div style={layerStyle(layer, selected)} onPointerDown={e => onPointerDown(e, "move")}>
  {layer.type === "text" && <div style={{ width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>{layer.text}</div>}
  {layer.type === "ellipse" && <div style={{ width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none" }} />}
  {layer.type === "rect" && <div style={{ width: "100%", height: "100%", pointerEvents: "none" }} />}
  {layer.type === "image" && <img src={layer.src || ""} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: String(layer.style?.["object-fit"] ?? "contain"), pointerEvents: "none" }} />}
  {selected && <><ResizeHandles layer={layer} onPointerDown={(e, handle) => onPointerDown(e, "resize", handle)} /><RotateHandle layer={layer} onPointerDown={e => onPointerDown(e, "rotate")} /></>}
</div>;
