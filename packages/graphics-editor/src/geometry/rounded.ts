import type { PathNode } from "../types";

/** Rounds polygon corners using the actual adjacent segment lengths. */
export function roundedPolygonNodes(nodes: PathNode[], radius: number, closed = true): PathNode[] {
  if (!closed || nodes.length < 3 || radius <= 0) return nodes.map(n => ({ ...n }));
  const out: PathNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const prev = nodes[(i - 1 + nodes.length) % nodes.length];
    const cur = nodes[i];
    const next = nodes[(i + 1) % nodes.length];
    const a = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const b = Math.hypot(next.x - cur.x, next.y - cur.y);
    const d = Math.min(radius, a / 2, b / 2);
    if (d <= 0) { out.push({ ...cur }); continue; }
    const inLen = Math.max(a, 1), outLen = Math.max(b, 1);
    const before = { x: cur.x + (prev.x - cur.x) * d / inLen, y: cur.y + (prev.y - cur.y) * d / inLen };
    const after = { x: cur.x + (next.x - cur.x) * d / outLen, y: cur.y + (next.y - cur.y) * d / outLen };
    out.push({ x: before.x, y: before.y, kind: "smooth", handleOut: after });
    out.push({ x: after.x, y: after.y, kind: "smooth", handleIn: before });
  }
  return out;
}
