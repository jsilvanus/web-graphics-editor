import type { Graphics3DMesh } from "../../types";
import { faceCornerForEdge, type BevelEdgeContext } from "./bevel-topology";

type Vec3 = [number, number, number];

export interface BevelPatch { indices: number[]; vertices: number[]; }

export function buildBevelPatch(mesh: Graphics3DMesh, context: BevelEdgeContext, amount: number): BevelPatch | null {
  if (context.faces.length !== 2 || amount <= 0) return null;
  const [f0, f1] = context.faces;
  const { a, b } = context.edge;
  const c0 = faceCornerForEdge(mesh, f0, a, b), c1 = faceCornerForEdge(mesh, f1, a, b);
  if (c0 === undefined || c1 === undefined) return null;
  const pa = point(mesh, a), pb = point(mesh, b), pc0 = point(mesh, c0), pc1 = point(mesh, c1);
  const d0 = Math.min(distance(pa, pc0), distance(pb, pc0));
  const d1 = Math.min(distance(pa, pc1), distance(pb, pc1));
  const t0 = Math.min(0.49, amount / Math.max(d0, 1e-8));
  const t1 = Math.min(0.49, amount / Math.max(d1, 1e-8));
  const a0 = lerp(pa, pc0, t0), b0 = lerp(pb, pc0, t0);
  const a1 = lerp(pa, pc1, t1), b1 = lerp(pb, pc1, t1);
  return { vertices: [...a0, ...b0, ...a1, ...b1], indices: [0, 1, 2, 0, 2, 3] };
}

function point(mesh: Graphics3DMesh, i: number): Vec3 { return [mesh.geometry.vertices[i * 3], mesh.geometry.vertices[i * 3 + 1], mesh.geometry.vertices[i * 3 + 2]]; }
function lerp(a: Vec3, b: Vec3, t: number): Vec3 { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function distance(a: Vec3, b: Vec3): number { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
