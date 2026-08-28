import type { Graphics3DMesh } from "../../types";
import { faceCornerForEdge, type BevelEdgeContext } from "./bevel-topology";

type Vec3 = [number, number, number];

/** Bevel a boundary edge by retaining the old boundary and inserting an inner edge. */
export function buildBoundaryBevel(mesh: Graphics3DMesh, context: BevelEdgeContext, amount: number): Graphics3DMesh | null {
  if (context.faces.length !== 1 || amount <= 0) return null;
  const face = context.faces[0], { a, b } = context.edge;
  const corner = faceCornerForEdge(mesh, face, a, b);
  if (corner === undefined) return null;
  const pa = point(mesh, a), pb = point(mesh, b), pc = point(mesh, corner);
  const t = Math.min(0.49, amount / Math.max(Math.min(distance(pa, pc), distance(pb, pc)), 1e-8));
  const ia = lerp(pa, pc, t), ib = lerp(pb, pc, t);
  const vertices = [...mesh.geometry.vertices, ...ia, ...ib];
  const iaIndex = mesh.geometry.vertices.length / 3, ibIndex = iaIndex + 1;
  const indices = [...mesh.geometry.indices], base = face * 3;
  const ids = [indices[base], indices[base + 1], indices[base + 2]];
  const inner = ids.map(id => id === a ? iaIndex : id === b ? ibIndex : id);
  indices[base] = inner[0]; indices[base + 1] = inner[1]; indices[base + 2] = inner[2];
  const reversed = ids.includes(a) && ids.includes(b) && ids[(ids.indexOf(a) + 1) % 3] === b;
  indices.push(...(reversed ? [a, b, ibIndex, a, ibIndex, iaIndex] : [a, iaIndex, ibIndex, a, ibIndex, b]));
  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices, normals: undefined, uv: undefined } };
}

function point(mesh: Graphics3DMesh, i: number): Vec3 { return [mesh.geometry.vertices[i * 3], mesh.geometry.vertices[i * 3 + 1], mesh.geometry.vertices[i * 3 + 2]]; }
function lerp(a: Vec3, b: Vec3, t: number): Vec3 { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function distance(a: Vec3, b: Vec3): number { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
