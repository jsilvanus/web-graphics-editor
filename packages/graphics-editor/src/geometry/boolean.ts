import type { PathNode } from "../types";
import { flattenPathNodes } from "../geometry";

export type BooleanOperation = "union" | "intersect" | "subtract";
export type PolygonPoint = { x: number; y: number };
export interface BooleanContour {
  points: PolygonPoint[];
  hole: boolean;
}
type Node = {
  p: PolygonPoint;
  next: Node;
  prev: Node;
  intersection: boolean;
  alpha: number;
  neighbor?: Node;
  entry?: boolean;
  visited?: boolean;
};
const EPS = 1e-7;
const same = (a: PolygonPoint, b: PolygonPoint) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
const area = (p: PolygonPoint[]) =>
  p.reduce((s, a, i) => {
    const b = p[(i + 1) % p.length];
    return s + a.x * b.y - a.y * b.x;
  }, 0) / 2;
const inside = (p: PolygonPoint, poly: PolygonPoint[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
function hit(a: PolygonPoint, b: PolygonPoint, c: PolygonPoint, d: PolygonPoint) {
  const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(den) < EPS) return null;
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
  const u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / den;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return { p: { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }, t, u };
}
function ring(poly: PolygonPoint[]) {
  const n = poly.map(p => ({ p: { ...p }, intersection: false, alpha: 0 }) as Partial<Node>);
  n.forEach((x, i) => {
    x.next = n[(i + 1) % n.length] as Node;
    x.prev = n[(i + n.length - 1) % n.length] as Node;
  });
  return n as Node[];
}
function fallback(a: PolygonPoint[], b: PolygonPoint[], op: BooleanOperation): BooleanContour[] {
  const ai = inside(b[0], a),
    bi = inside(a[0], b);
  if (op === "intersect") return ai ? [{ points: b, hole: false }] : bi ? [{ points: a, hole: false }] : [];
  if (op === "union")
    return ai
      ? [{ points: a, hole: false }]
      : bi
        ? [{ points: b, hole: false }]
        : [
            { points: a, hole: false },
            { points: b, hole: false },
          ];
  if (ai)
    return [
      { points: a, hole: false },
      { points: b, hole: true },
    ];
  return [{ points: a, hole: false }];
}
/**
 * Boolean of two simple polygons (Greiner–Hormann clipping).
 *
 * Both polygons are normalised to the same orientation. Intersections are computed on the original
 * edges, spliced into both rings in edge order, and the result is traced by walking one ring until
 * the next intersection and then switching to the other: forward on both rings for intersect and
 * union, backwards on the cutter for subtract. Without proper crossings (disjoint, containment or
 * only touching) the containment fallback applies.
 */
export function booleanContours(
  a: PolygonPoint[],
  b: PolygonPoint[],
  op: BooleanOperation,
): BooleanContour[] {
  if (a.length < 3 || b.length < 3) return [];
  // Same orientation for both, otherwise "forward" means different things on each ring.
  const orient = (p: PolygonPoint[]) => (area(p) < 0 ? [...p].reverse() : p);
  const polyA = orient(a),
    polyB = orient(b);
  const A = ring(polyA),
    B = ring(polyB);

  // 1. Find crossings on the original edges (endpoints excluded, so shared vertices don't double up).
  const hitsA = A.map(() => [] as Node[]),
    hitsB = B.map(() => [] as Node[]);
  for (let i = 0; i < polyA.length; i++)
    for (let j = 0; j < polyB.length; j++) {
      const h = hit(polyA[i], polyA[(i + 1) % polyA.length], polyB[j], polyB[(j + 1) % polyB.length]);
      if (!h || h.t <= EPS || h.t >= 1 - EPS || h.u <= EPS || h.u >= 1 - EPS) continue;
      const an = { p: h.p, intersection: true, alpha: h.t } as Node,
        bn = { p: { ...h.p }, intersection: true, alpha: h.u } as Node;
      an.neighbor = bn;
      bn.neighbor = an;
      hitsA[i].push(an);
      hitsB[j].push(bn);
    }
  const crossings = hitsA.flat();
  if (crossings.length < 2) return fallback(a, b, op);

  // 2. Splice them into the rings in order along each edge.
  const splice = (nodes: Node[], hits: Node[][]) =>
    nodes.forEach((node, i) => {
      let cur = node;
      for (const h of hits[i].sort((x, y) => x.alpha - y.alpha)) {
        h.next = cur.next;
        h.prev = cur;
        cur.next.prev = h;
        cur.next = h;
        cur = h;
      }
    });
  splice(A, hitsA);
  splice(B, hitsB);

  // 3. Trace. Start on A at crossings where A continues into the wanted region.
  const backwardsOnB = op === "subtract";
  const wantInsideB = op === "intersect";
  const after = (n: Node, other: PolygonPoint[]) =>
    inside({ x: n.p.x + (n.next.p.x - n.p.x) * 1e-6, y: n.p.y + (n.next.p.y - n.p.y) * 1e-6 }, other);
  const result: BooleanContour[] = [];
  for (const start of crossings) {
    if (start.visited || after(start, polyB) !== wantInsideB) continue;
    const out: PolygonPoint[] = [];
    let cur = start,
      onA = true,
      guard = 0;
    while (guard++ < 100000) {
      cur.visited = true;
      if (cur.neighbor) cur.neighbor.visited = true;
      out.push(cur.p);
      const step = (n: Node) => (!onA && backwardsOnB ? n.prev : n.next);
      cur = step(cur);
      while (!cur.intersection) {
        out.push(cur.p);
        cur = step(cur);
      }
      if (cur === start || cur.neighbor === start) break;
      cur = cur.neighbor!;
      onA = !onA;
    }
    if (out.length > 2 && Math.abs(area(out)) > EPS) result.push({ points: out, hole: false });
  }
  return result.length ? result : fallback(a, b, op);
}
export function booleanPolygons(
  a: PolygonPoint[],
  b: PolygonPoint[],
  op: BooleanOperation,
): PolygonPoint[][] {
  return booleanContours(a, b, op)
    .filter(contour => !contour.hole)
    .map(contour => contour.points);
}
export function pathNodesToPolygon(
  nodes: PathNode[],
  closed = true,
  tolerance = 0.75,
): PolygonPoint[] | null {
  if (nodes.length < 3 || !closed) return null;
  return flattenPathNodes(nodes, closed, tolerance).points;
}
export function polygonToPathNodes(poly: PolygonPoint[]): PathNode[] {
  return poly.map(p => ({ x: p.x, y: p.y, kind: "corner" }));
}
