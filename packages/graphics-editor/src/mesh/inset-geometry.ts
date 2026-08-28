import type { Vec3 } from "../types";

/**
 * Computes a constant-distance inset polygon in the plane of a face.
 * The input polygon must be ordered around the face. Distance is measured in
 * the face plane, rather than as a percentage toward the centroid.
 */
export function insetPolygonConstantDistance(points: Vec3[], distance: number): Vec3[] {
  if (points.length < 3 || distance <= 0) return points.map(p => [...p] as Vec3);

  const normal = polygonNormal(points);
  if (length(normal) < 1e-9) return points.map(p => [...p] as Vec3);

  const result: Vec3[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const e0 = normalize(sub(current, prev));
    const e1 = normalize(sub(next, current));
    const inward0 = normalize(cross(normal, e0));
    const inward1 = normalize(cross(normal, e1));
    const bisector = normalize(add(inward0, inward1));
    const denom = Math.max(1e-6, dot(bisector, inward0));
    const offset = distance / denom;
    result.push(add(current, scale(bisector, offset)));
  }
  return result;
}

function polygonNormal(points: Vec3[]): Vec3 {
  const n: Vec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return normalize(n);
}
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function scale(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s]; }
function cross(a: Vec3, b: Vec3): Vec3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a: Vec3, b: Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function length(a: Vec3): number { return Math.hypot(a[0], a[1], a[2]); }
function normalize(a: Vec3): Vec3 { const l = length(a); return l < 1e-12 ? [0, 0, 0] : scale(a, 1 / l); }
