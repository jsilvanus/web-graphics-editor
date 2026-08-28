import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { useState } from "react";
import type { Layer, PathNode, Point } from "../../types";

export const PathEditor: FC<{ layer: Layer; onNodes: (nodes: PathNode[]) => void }> = ({ layer, onNodes }) => {
  const nodes = layer.nodes ?? [];
  const [drag, setDrag] = useState<{ index: number; part: "node" | "in" | "out"; start: Point; nodes: PathNode[] } | null>(null);
  const point = (event: ReactPointerEvent, svg: SVGSVGElement) => { const r = svg.getBoundingClientRect(); return { x: (event.clientX - r.left) * layer.width / r.width, y: (event.clientY - r.top) * layer.height / r.height }; };
  const begin = (event: ReactPointerEvent, index: number, part: "node" | "in" | "out") => { const svg = event.currentTarget.ownerSVGElement; if (!svg) return; event.stopPropagation(); (event.currentTarget as Element).setPointerCapture?.(event.pointerId); setDrag({ index, part, start: point(event, svg), nodes: nodes.map(n => ({ ...n, handleIn: n.handleIn && { ...n.handleIn }, handleOut: n.handleOut && { ...n.handleOut } })) }); };
  const move = (event: ReactPointerEvent) => { if (!drag) return; const svg = event.currentTarget as SVGSVGElement; const p = point(event, svg); const dx = p.x - drag.start.x, dy = p.y - drag.start.y; const next = drag.nodes.map((node, i) => {
    if (i !== drag.index) return node;
    if (drag.part === "node") return { ...node, x: node.x + dx, y: node.y + dy, handleIn: node.handleIn && { x: node.handleIn.x + dx, y: node.handleIn.y + dy }, handleOut: node.handleOut && { x: node.handleOut.x + dx, y: node.handleOut.y + dy } };
    const key = drag.part === "in" ? "handleIn" : "handleOut";
    return { ...node, [key]: p } as PathNode;
  });
  onNodes(next); setDrag({ ...drag, start: p, nodes: next }); };
  return <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 500, pointerEvents: "none" }} onPointerMove={move}>
    {nodes.map((node, i) => <g key={i}>
      {node.handleIn && <><line x1={node.x} y1={node.y} x2={node.handleIn.x} y2={node.handleIn.y} stroke="#38bdf8" strokeDasharray="4 3" /><circle cx={node.handleIn.x} cy={node.handleIn.y} r="5" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => begin(e, i, "in")} /></>}
      {node.handleOut && <><line x1={node.x} y1={node.y} x2={node.handleOut.x} y2={node.handleOut.y} stroke="#38bdf8" strokeDasharray="4 3" /><circle cx={node.handleOut.x} cy={node.handleOut.y} r="5" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => begin(e, i, "out")} /></>}
      <circle cx={node.x} cy={node.y} r="7" fill={node.kind === "smooth" ? "#38bdf8" : "#fff"} stroke="#38bdf8" strokeWidth="3" style={{ pointerEvents: "all", cursor: "move" }} onPointerDown={e => begin(e, i, "node")} />
    </g>)}
  </svg>;
};
