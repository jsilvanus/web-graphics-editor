import type { CSSProperties } from "react";
import { GRID } from "./constants";
import type { Layer, PathNode, Point } from "./types";
import { gradientToCss } from "./gradient";
export { linePath, orthogonalPoint, pathCommandsToD, roundedRectPath } from "./geometry/path";
export function anchor(handle: string, layer: Layer) {
  const { width, height } = layer;
  return {
    left: handle.includes("e") ? width : handle.includes("w") ? 0 : width / 2,
    top: handle.includes("s") ? height : handle.includes("n") ? 0 : height / 2,
  };
}
export function resizeLayer(handle: string, start: Layer, dx: number, dy: number) {
  let { x, y, width, height } = start;
  if (handle.includes("e")) width += dx;
  if (handle.includes("w")) {
    x += dx;
    width -= dx;
  }
  if (handle.includes("s")) height += dy;
  if (handle.includes("n")) {
    y += dy;
    height -= dy;
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(20, Math.round(width)),
    height: Math.max(20, Math.round(height)),
  };
}
export function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}
export function layerStyle(layer: Layer, selected: boolean): CSSProperties {
  const css: CSSProperties = {};
  for (const [key, value] of Object.entries(layer.style ?? {}))
    (css as Record<string, unknown>)[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  const gradient = gradientToCss(layer.gradient);
  if (gradient !== "none") css.backgroundImage = gradient;
  return {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    boxSizing: "border-box",
    userSelect: "none",
    cursor: "move",
    outline: selected ? "3px solid #38bdf8" : undefined,
    opacity: Math.max(0, Math.min(1, layer.opacity ?? 1)),
    animation: layer.animation || undefined,
    transform:
      [
        layer.rotation ? `rotate(${layer.rotation}deg)` : "",
        layer.skewX ? `skewX(${layer.skewX}deg)` : "",
        layer.skewY ? `skewY(${layer.skewY}deg)` : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    transformOrigin: layer.transformOrigin
      ? `${layer.transformOrigin.x}px ${layer.transformOrigin.y}px`
      : undefined,
    ...css,
  };
}
export function parsePx(value: unknown, fallback = 0) {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
}
export function styleValue(layer: Layer, key: string, fallback = "") {
  return String(layer.style?.[key] ?? fallback);
}
export function nodesToD(nodes: PathNode[], closed = false): string {
  if (!nodes.length) return "";
  const parts = [`M ${nodes[0].x} ${nodes[0].y}`];
  const end = closed ? nodes.length : nodes.length - 1;
  for (let i = 1; i < end; i++) parts.push(segmentD(nodes[i - 1], nodes[i]));
  if (closed && nodes.length > 1) {
    parts.push(segmentD(nodes[nodes.length - 1], nodes[0]));
    parts.push("Z");
  }
  return parts.join(" ");
}
function segmentD(a: PathNode, b: PathNode): string {
  if (a.handleOut || b.handleIn) {
    const c1 = a.handleOut ?? { x: a.x, y: a.y },
      c2 = b.handleIn ?? { x: b.x, y: b.y };
    return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
  }
  return `L ${b.x} ${b.y}`;
}
export function mirrorHandle(node: PathNode, moved: "in" | "out", point: Point): PathNode {
  if (node.kind !== "smooth") return { ...node, [moved === "in" ? "handleIn" : "handleOut"]: point };
  const opposite = moved === "in" ? "handleOut" : "handleIn",
    dx = point.x - node.x,
    dy = point.y - node.y,
    length = Math.hypot(dx, dy);
  if (!length) return { ...node, [moved === "in" ? "handleIn" : "handleOut"]: point };
  const oppositeLength = node[opposite]
      ? Math.hypot(node[opposite]!.x - node.x, node[opposite]!.y - node.y)
      : length,
    other = { x: node.x - (dx / length) * oppositeLength, y: node.y - (dy / length) * oppositeLength };
  return { ...node, [moved === "in" ? "handleIn" : "handleOut"]: point, [opposite]: other };
}

/** Reverse path traversal without changing its visual geometry. Handles swap sides when traversal reverses. */
export function reversePathNodes(nodes: PathNode[]): PathNode[] {
  return nodes
    .slice()
    .reverse()
    .map(node => ({
      ...node,
      handleIn: node.handleOut && { ...node.handleOut },
      handleOut: node.handleIn && { ...node.handleIn },
    }));
}

export interface FlattenedPath {
  points: Point[];
  closed: boolean;
}

export function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

export function quadraticBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function pointLineDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = Math.hypot(dx, dy);
  if (!length) return Math.hypot(point.x - a.x, point.y - a.y);
  return Math.abs(dy * point.x - dx * point.y + b.x * a.y - b.y * a.x) / length;
}

function flattenCubic(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  tolerance: number,
  out: Point[],
  depth = 0,
): void {
  const flatness = Math.max(pointLineDistance(p1, p0, p3), pointLineDistance(p2, p0, p3));
  if (flatness <= tolerance || depth >= 12) {
    out.push(p3);
    return;
  }
  const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
    p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    p23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
  const p012 = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 },
    p123 = { x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2 },
    mid = { x: (p012.x + p123.x) / 2, y: (p012.y + p123.y) / 2 };
  flattenCubic(p0, p01, p012, mid, tolerance, out, depth + 1);
  flattenCubic(mid, p123, p23, p3, tolerance, out, depth + 1);
}

function flattenQuadratic(p0: Point, p1: Point, p2: Point, tolerance: number, out: Point[], depth = 0): void {
  const flatness = pointLineDistance(p1, p0, p2);
  if (flatness <= tolerance || depth >= 12) {
    out.push(p2);
    return;
  }
  const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
    p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    mid = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
  flattenQuadratic(p0, p01, mid, tolerance, out, depth + 1);
  flattenQuadratic(mid, p12, p2, tolerance, out, depth + 1);
}

export function flattenPathNodes(nodes: PathNode[], closed = false, tolerance = 0.75): FlattenedPath {
  if (!nodes.length) return { points: [], closed };
  const points: Point[] = [{ x: nodes[0].x, y: nodes[0].y }],
    count = closed ? nodes.length : nodes.length - 1;
  for (let i = 0; i < count; i++) {
    const a = nodes[i],
      b = nodes[(i + 1) % nodes.length];
    if (a.handleOut || b.handleIn) {
      const c1 = a.handleOut ?? { x: a.x, y: a.y },
        c2 = b.handleIn ?? { x: b.x, y: b.y };
      flattenCubic({ x: a.x, y: a.y }, c1, c2, { x: b.x, y: b.y }, tolerance, points);
    } else points.push({ x: b.x, y: b.y });
  }
  if (closed && points.length > 1) {
    const first = points[0],
      last = points[points.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-9) points.pop();
  }
  return { points, closed };
}

function lineIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const abx = b.x - a.x,
    aby = b.y - a.y,
    cdx = d.x - c.x,
    cdy = d.y - c.y,
    denominator = abx * cdy - aby * cdx;
  if (Math.abs(denominator) < 1e-9) return null;
  const t = ((c.x - a.x) * cdy - (c.y - a.y) * cdx) / denominator;
  return { x: a.x + t * abx, y: a.y + t * aby };
}

function offsetPolyline(points: Point[], distance: number, closed: boolean): Point[] {
  if (points.length < 2 || distance === 0) return points.map(p => ({ ...p }));
  const n = points.length,
    result: Point[] = [];
  const normal = (a: Point, b: Point) => {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy) || 1;
    return { x: (-dy / len) * distance, y: (dx / len) * distance };
  };
  for (let i = 0; i < n; i++) {
    if (!closed && i === 0) {
      const q = normal(points[0], points[1]);
      result.push({ x: points[0].x + q.x, y: points[0].y + q.y });
      continue;
    }
    if (!closed && i === n - 1) {
      const q = normal(points[n - 2], points[n - 1]);
      result.push({ x: points[n - 1].x + q.x, y: points[n - 1].y + q.y });
      continue;
    }
    const prev = points[(i - 1 + n) % n],
      cur = points[i],
      next = points[(i + 1) % n],
      n1 = normal(prev, cur),
      n2 = normal(cur, next);
    const hit = lineIntersection(
      { x: prev.x + n1.x, y: prev.y + n1.y },
      { x: cur.x + n1.x, y: cur.y + n1.y },
      { x: cur.x + n2.x, y: cur.y + n2.y },
      { x: next.x + n2.x, y: next.y + n2.y },
    );
    result.push(
      hit && Number.isFinite(hit.x) && Number.isFinite(hit.y)
        ? hit
        : { x: cur.x + (n1.x + n2.x) / 2, y: cur.y + (n1.y + n2.y) / 2 },
    );
  }
  return result;
}

/** Offset straight and Bézier paths by adaptively flattening curves first. */
export function offsetPathNodes(
  nodes: PathNode[],
  distance: number,
  closed = false,
  tolerance = 0.75,
): PathNode[] {
  if (nodes.length < 2 || !Number.isFinite(distance) || distance === 0) return nodes.map(n => ({ ...n }));
  const flattened = flattenPathNodes(nodes, closed, tolerance);
  return offsetPolyline(flattened.points, distance, closed).map(p => ({
    x: p.x,
    y: p.y,
    kind: "corner" as const,
  }));
}
