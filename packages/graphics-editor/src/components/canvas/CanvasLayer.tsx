import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import { VectorLayer } from "./VectorLayer";
import type { Layer } from "../../types";

export const CanvasLayer: FC<{
  layer: Layer;
  selected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
}> = ({ layer, selected, onPointerDown }) => {
  if (layer.type === "line" || layer.type === "path") return <VectorLayer layer={layer} selected={selected} onPointerDown={onPointerDown} />;
  return <div style={layerStyle(layer, selected)} onPointerDown={event => onPointerDown(event, "move")}>
    {layer.type === "text" && <div style={{ width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>{layer.text}</div>}
    {layer.type === "ellipse" && <div style={{ width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none" }} />}
    {layer.type === "rectangle" && <div style={{ width: "100%", height: "100%", pointerEvents: "none" }} />}
    {layer.type === "image" && <img src={layer.src || ""} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: String(layer.style?.["object-fit"] ?? "contain"), pointerEvents: "none" }} />}
    {selected && <><ResizeHandles layer={layer} onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)} /><RotateHandle layer={layer} onPointerDown={event => onPointerDown(event, "rotate")} /></>}
  </div>;
};
