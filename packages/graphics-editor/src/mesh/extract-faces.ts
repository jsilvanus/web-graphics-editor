import type { Graphics3DMesh } from "../types";
import { faceVertexIndices } from "../3d-mesh-operations";

/**
 * Extract selected faces into a separate mesh while preserving their current
 * vertex positions. Shared vertices are duplicated only inside the extracted
 * mesh; the source mesh is left unchanged.
 */
export function extractFaces(source: Graphics3DMesh, faceIds: Set<number>): Graphics3DMesh | null {
  if (!faceIds.size) return null;

  const vertices: number[] = [];
  const indices: number[] = [];
  const remap = new Map<number, number>();

  for (const faceId of [...faceIds].sort((a, b) => a - b)) {
    const ids = faceVertexIndices(source, faceId);
    if (!ids || ids.length < 3) continue;
    const mapped = ids.map(id => {
      const existing = remap.get(id);
      if (existing !== undefined) return existing;
      const next = vertices.length / 3;
      vertices.push(
        source.geometry.vertices[id * 3],
        source.geometry.vertices[id * 3 + 1],
        source.geometry.vertices[id * 3 + 2],
      );
      remap.set(id, next);
      return next;
    });
    for (let i = 1; i < mapped.length - 1; i++) indices.push(mapped[0], mapped[i], mapped[i + 1]);
  }

  if (!indices.length) return null;
  return {
    ...source,
    id: `${source.id}-extract-${Date.now()}`,
    geometry: {
      vertices,
      indices,
    },
  };
}
