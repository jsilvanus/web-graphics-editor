import type { Graphics3DMesh } from "../types";

/**
 * Delete selected vertices and all triangles incident to them.
 * Remaining vertex indices are compacted and rewritten.
 */
export function deleteVertices(mesh: Graphics3DMesh, vertexIds: number[]): Graphics3DMesh {
  const count = mesh.geometry.vertices.length / 3;
  const deleted = new Set(vertexIds.filter(id => Number.isInteger(id) && id >= 0 && id < count));
  if (!deleted.size) return mesh;

  const kept = Array.from({ length: count }, (_, id) => id).filter(id => !deleted.has(id));
  const remap = new Map(kept.map((old, next) => [old, next]));
  const vertices: number[] = [];
  for (const old of kept) {
    vertices.push(
      mesh.geometry.vertices[old * 3],
      mesh.geometry.vertices[old * 3 + 1],
      mesh.geometry.vertices[old * 3 + 2],
    );
  }

  const indices: number[] = [];
  for (let i = 0; i + 2 < mesh.geometry.indices.length; i += 3) {
    const a = mesh.geometry.indices[i];
    const b = mesh.geometry.indices[i + 1];
    const c = mesh.geometry.indices[i + 2];
    if (deleted.has(a) || deleted.has(b) || deleted.has(c)) continue;
    indices.push(remap.get(a)!, remap.get(b)!, remap.get(c)!);
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices } };
}
