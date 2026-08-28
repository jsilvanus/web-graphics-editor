import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { useState } from "react";
import type { Layer, PathNode, Point } from "../../types";
import { mirrorHandle } from "../../geometry";

export const PathEditor: FC<{ layer: Layer; onNodes: (nodes: PathNode[]) => void }> = ({ layer, onNodes }) => {
  const nodes = layer.nodes ?? [];
  const [drag, setDrag] = useState<{ index: number; part: "node" | "in" | "out"; start: Point; nodes: PathNode[]; broken?: boolean } | null>(null);
  const point = (event: ReactPointerEvent, svg: SVGSVGElement) => { const r = svg.getBoundingClientRect(); return { x: (event.clientX - r.left) * layer.width / r.width, y: (event.clientY - r.top) * layer.height / r.height }; };
  const clone = () => nodes.map(n => ({ ...n, handleIn: n.handleIn && { ...n.handleIn }, handleOut: n.handleOut && { ...n.handleOut } }));
  const begin = (event: ReactPointerEvent, index: number, part: "node" | "in" | "out") => { const svg = event.currentTarget.ownerSVGElement; if (!svg) return; event.stopPropagation(); const broken = event.altKey || event.metaKey; if (broken && part !== "node") { const next = clone(); next[index].kind = "corner"; onNodes(next); } setDrag({ index, part, start: point(event, svg), nodes: clone(), broken }); };
  const move = (event: ReactPointerEvent) => { if (!drag) return; const svg = event.currentTarget as SVGSVGElement; const p = point(event, svg); const dx = p.x - drag.start.x, dy = p.y - drag.start.y; const next = drag.nodes.map((node, i) => {
    if (i !== drag.index) return node;
    if (drag.part === "node") return { ...node, x: node.x + dx, y: node.y + dy, handleIn: node.handleIn && { x: node.handleIn.x + dx, y: node.handleIn.y + dy }, handleOut: node.handleOut && { x: node.handleOut.x + dx, y: node.handleOut.y + dy } };
    if (drag.broken) return { ...node, [drag.part === "in" ? "handleIn" : "handleOut"]: p };
    return mirrorHandle(node, drag.part, p);
  }); onNodes(next); setDrag({ ...drag, start: p, nodes: next }); };
  const toggleKind = (index: number) => { const next = clone(); next[index].kind = next[index].kind === "smooth" ? "corner" : "smooth"; onNodes(next); };
  const addHandle = (index: number, part: "in" | "out") => { const next = clone(); const n = next[index]; const dx = part === "in" ? -50 : 50; const handle = { x: n.x + dx, y: n.y }; if (part === "in") n.handleIn = handle; else n.handleOut = handle; n.kind = "smooth"; onNodes(next); };
  const deleteNode = (index: number) => { if (nodes.length <= 2) return; const next = clone(); next.splice(index, 1); onNodes(next); };
  const insertNode = (event: ReactPointerEvent, index: number) => { const svg = event.currentTarget.ownerSVGElement; if (!svg) return; event.stopPropagation(); const p = point(event, svg); const a = nodes[index], b = nodes[(index + 1) % nodes.length]; const next = clone(); const node: PathNode = { x: p.x, y: p.y, kind: "corner" }; next.splice(index + 1, 0, node); onNodes(next); };
  return <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 500, pointerEvents: "none" }} onPointerMove={move} onPointerUp={() => setDrag(null)}>
    {nodes.map((node, i) => <g key={i}>
      <line x1={node.x} y1={node.y} x2={nodes[(i + 1) % nodes.length].x} y2={nodes[(i + 1) % nodes.length].y} stroke="transparent" strokeWidth="18" style={{ pointerEvents: "all", cursor: "copy" }} onDoubleClick={e => insertNode(e, i)} />
      {node.handleIn && <><line x1={node.x} y1={node.y} x2={node.handleIn.x} y2={node.handleIn.y} stroke="#38bdf8" strokeDasharray="4 3" /><circle cx={node.handleIn.x} cy={node.handleIn.y} r="5" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => begin(e, i, "in")} /></>}
      {node.handleOut && <><line x1={node.x} y1={node.y} x2={node.handleOut.x} y2={node.handleOut.y} stroke="#38bdf8" strokeDasharray="4 3" /><circle cx={node.handleOut.x} cy={node.handleOut.y} r="5" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => begin(e, i, "out")} /></>}
      <circle cx={node.x} cy={node.y} r="7" fill={node.kind === "smooth" ? "#38bdf8" : "#fff"} stroke="#38bdf8" strokeWidth="3" style={{ pointerEvents: "all", cursor: "move" }} onPointerDown={e => begin(e, i, "node")} onDoubleClick={() => toggleKind(i)} onContextMenu={e => { e.preventDefault(); deleteNode(i); }} />
      {node.kind === "smooth" && !node.handleIn && <circle cx={node.x - 11} cy={node.y} r="3" fill="#38bdf8" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => { e.stopPropagation(); addHandle(i, "in"); }} />}
      {node.kind === "smooth" && !node.handleOut && <circle cx={node.x + 11} cy={node.y} r="3" fill="#38bdf8" style={{ pointerEvents: "all", cursor: "crosshair" }} onPointerDown={e => { e.stopPropagation(); addHandle(i, "out"); }} />}
    </g>)}
  </svg>;
};
