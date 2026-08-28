import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import { buildBevelPatch } from "./bevel-geometry";
import { collectBevelEdges, faceCornerForEdge } from "./bevel-topology";

export function bevelOneEdge(mesh: Graphics3DMesh, key: string, amount: number): Graphics3DMesh {
  const context = collectBevelEdges(mesh, new Set([key]))[0];
  if (!context || context.faces.length !== 2) return mesh;
  const patch = buildBevelPatch(mesh, context, amount);
  if (!patch) return mesh;

  const [f0, f1] = context.faces;
  const { a, b } = context.edge;
  const c0 = faceCornerForEdge(mesh, f0, a, b);
  const c1 = faceCornerForEdge(mesh, f1, a, b);
  if (c0 === undefined || c1 === undefined) return mesh;

  const vertices = [...mesh.geometry.vertices, ...patch.vertices];
  const base = mesh.geometry.vertices.length / 3;
  const a0 = base, b0 = base + 1, a1 = base + 2, b1 = base + 3;
  const indices = [...mesh.geometry.indices];

  replaceFaceEdge(indices, f0, a, b, c0, a0, b0);
  replaceFaceEdge(indices, f1, a, b, c1, a1, b1);
  indices.push(a0, b0, b1, a0, b1, a1);

  return {
    ...mesh,
    geometry: { ...mesh.geometry, vertices, indices, normals: undefined, uv: undefined },
  };
}

function replaceFaceEdge(indices: number[], face: number, a: number, b: number, corner: number, newA: number, newB: number): void {
  const i = face * 3;
  const ids = [indices[i], indices[i + 1], indices[i + 2]];
  const aAt = ids.indexOf(a), bAt = ids.indexOf(b);
  if (aAt < 0 || bAt < 0 || ids.indexOf(corner) < 0) return;
  const orderedA = aAt < bAt ? newA : newB;
  const orderedB = aAt < bAt ? newB : newA;
  indices[i] = ids[0] === a ? orderedA : ids[0] === b ? orderedB : corner;
  indices[i + 1] = ids[1] === a ? orderedA : ids[1] === b ? orderedB : corner;
  indices[i + 2] = ids[2] === a ? orderedA : ids[2] === b ? orderedB : corner;
}

export function bevelSelectedEdges(mesh: Graphics3DMesh, keys: Set<string>, amount: number): Graphics3DMesh {
  if (amount <= 0) return mesh;
  let next = mesh;
  for (const key of [...keys]) next = bevelOneEdge(next, key, amount);
  return next;
}

export function hasBevelableEdge(mesh: Graphics3DMesh, key: string): boolean {
  const edge = meshEdges(mesh).find(e => edgeKey(e.a, e.b) === key);
  return !!edge && edge.faces.length === 2;
}
