import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import { pathCommandsToD, linePath } from "../../geometry/path";
import type { Layer } from "../../types";

export const VectorLayer: FC<{
  layer: Layer;
  selected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
}> = ({ layer, selected, onPointerDown }) => {
  const stroke = String(layer.style?.stroke ?? "none");
  const fill = String(layer.style?.fill ?? "none");
  const strokeWidth = Number(layer.style?.["stroke-width"] ?? 1);
  const d = layer.type === "line"
    ? linePath(0, 0, layer.width, layer.height)
    : layer.path || (layer.pathCommands ? pathCommandsToD(layer.pathCommands) : "");
  return <div style={layerStyle(layer, selected)} onPointerDown={event => onPointerDown(event, "move")}>
    <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill={layer.type === "line" ? "none" : fill} stroke={stroke === "none" && layer.type === "line" ? String(layer.style?.color ?? "#fff") : stroke} strokeWidth={strokeWidth} strokeLinecap={String(layer.style?.["stroke-linecap"] ?? "round")} strokeLinejoin={String(layer.style?.["stroke-linejoin"] ?? "round")} opacity={Number(layer.style?.opacity ?? 1)} vectorEffect="non-scaling-stroke" />
    </svg>
    {selected && <><ResizeHandles layer={layer} onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)} /><RotateHandle layer={layer} onPointerDown={event => onPointerDown(event, "rotate")} /></>}
  </div>;
};
