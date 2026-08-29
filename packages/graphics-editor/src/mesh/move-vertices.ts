import type { Graphics3DMesh } from "../types";

type Vec3 = [number, number, number];

/** Return a mesh with the supplied vertex indices translated by the same delta. */
export function moveVertices(mesh: Graphics3DMesh, vertexIds: Iterable<number>, delta: Vec3): Graphics3DMesh {
  const vertices = [...mesh.geometry.vertices];
  const count = vertices.length / 3;

  for (const id of vertexIds) {
    if (!Number.isInteger(id) || id < 0 || id >= count) continue;
    vertices[id * 3] += delta[0];
    vertices[id * 3 + 1] += delta[1];
    vertices[id * 3 + 2] += delta[2];
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices } };
}
