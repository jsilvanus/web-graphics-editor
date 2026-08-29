import type { Graphics3DMesh } from "../types";

type Vec3 = [number, number, number];

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Weld vertices within tolerance and rewrite triangle indices. */
export function weldVertices(mesh: Graphics3DMesh, vertexIds?: number[], tolerance = 1e-6): Graphics3DMesh {
  const count = mesh.geometry.vertices.length / 3;
  const selected = vertexIds ? new Set(vertexIds.filter(id => Number.isInteger(id) && id >= 0 && id < count)) : null;
  const representatives = Array.from({ length: count }, (_, id) => id);
  const limit = Math.max(0, tolerance);

  for (let i = 0; i < count; i++) {
    if (selected && !selected.has(i)) continue;
    const a: Vec3 = [mesh.geometry.vertices[i * 3], mesh.geometry.vertices[i * 3 + 1], mesh.geometry.vertices[i * 3 + 2]];
    for (let j = 0; j < i; j++) {
      if (selected && !selected.has(j)) continue;
      const b: Vec3 = [mesh.geometry.vertices[j * 3], mesh.geometry.vertices[j * 3 + 1], mesh.geometry.vertices[j * 3 + 2]];
      if (distance(a, b) <= limit) {
        representatives[i] = representatives[j];
        break;
      }
    }
  }

  const used = [...new Set(representatives)];
  const remap = new Map(used.map((old, next) => [old, next]));
  const vertices: number[] = [];
  for (const old of used) vertices.push(mesh.geometry.vertices[old * 3], mesh.geometry.vertices[old * 3 + 1], mesh.geometry.vertices[old * 3 + 2]);
  const indexMap = representatives.map(old => remap.get(old)!);
  const indices = mesh.geometry.indices.map(index => indexMap[index]);
  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices } };
}
