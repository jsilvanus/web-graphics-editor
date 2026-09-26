import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { PathEditor } from "./PathEditor";
import { layerStyle, nodesToD, reversePathNodes } from "../../geometry";
import { pathCommandsToD, linePath } from "../../geometry/path";
import type { Layer, PathNode } from "../../types";
export const VectorLayer: FC<{
  layer: Layer;
  selected: boolean;
  multiSelected: boolean;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  onNodes?: (nodes: PathNode[]) => void;
}> = ({ layer, selected, multiSelected, onPointerDown, onNodes }) => {
  const stroke = String(layer.style?.stroke ?? "none"),
    fill = String(layer.style?.fill ?? "none"),
    strokeWidth = Number(layer.style?.["stroke-width"] ?? 1),
    fillRule = String(layer.style?.["fill-rule"] ?? "nonzero"),
    reversed = String(layer.style?.["path-direction"] ?? "forward") === "reverse";
  const nodes = layer.nodes?.length ? (reversed ? reversePathNodes(layer.nodes) : layer.nodes) : undefined;
  const d =
    layer.type === "line"
      ? reversed
        ? linePath(layer.width, layer.height, 0, 0)
        : linePath(0, 0, layer.width, layer.height)
      : nodes
        ? nodesToD(nodes, layer.closed)
        : layer.path || (layer.pathCommands ? pathCommandsToD(layer.pathCommands) : "");
  return (
    <div style={layerStyle(layer, selected)} onPointerDown={event => onPointerDown(event, "move")}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`}
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible", pointerEvents: "none" }}
      >
        {layer.gradient && (
          <defs>
            {layer.gradient.type === "linear" ? (
              <linearGradient
                id={`ge-gradient-${layer.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
                gradientTransform={`rotate(${layer.gradient.angle ?? 90} .5 .5)`}
              >
                {layer.gradient.stops.map((stop, i) => (
                  <stop
                    key={i}
                    offset={`${Math.max(0, Math.min(1, stop.offset)) * 100}%`}
                    stopColor={stop.color}
                    stopOpacity={stop.opacity ?? 1}
                  />
                ))}
              </linearGradient>
            ) : (
              <radialGradient
                id={`ge-gradient-${layer.id}`}
                cx={`${layer.gradient.cx ?? 50}%`}
                cy={`${layer.gradient.cy ?? 50}%`}
              >
                {layer.gradient.stops.map((stop, i) => (
                  <stop
                    key={i}
                    offset={`${Math.max(0, Math.min(1, stop.offset)) * 100}%`}
                    stopColor={stop.color}
                    stopOpacity={stop.opacity ?? 1}
                  />
                ))}
              </radialGradient>
            )}
          </defs>
        )}
        <path
          d={d}
          fill={layer.type === "line" ? "none" : layer.gradient ? `url(#ge-gradient-${layer.id})` : fill}
          fillRule={fillRule}
          stroke={stroke === "none" && layer.type === "line" ? String(layer.style?.color ?? "#fff") : stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={String(layer.style?.["stroke-linecap"] ?? "round")}
          strokeLinejoin={String(layer.style?.["stroke-linejoin"] ?? "round")}
          opacity={Number(layer.style?.opacity ?? 1)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {selected && !multiSelected && (
        <>
          <ResizeHandles
            layer={layer}
            onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)}
          />
          <RotateHandle layer={layer} onPointerDown={event => onPointerDown(event, "rotate")} />
        </>
      )}
      {selected && layer.type === "path" && layer.nodes?.length && onNodes && !multiSelected && (
        <PathEditor layer={layer} onNodes={onNodes} />
      )}
    </div>
  );
};
