import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";

/** Small topology helper for identifying vertices shared by selected edges. */
export function sharedBevelVertices(mesh: Graphics3DMesh, selected: Set<string>): number[] {
  const counts = new Map<number, number>();
  for (const edge of meshEdges(mesh)) {
    if (!selected.has(edgeKey(edge.a, edge.b))) continue;
    counts.set(edge.a, (counts.get(edge.a) ?? 0) + 1);
    counts.set(edge.b, (counts.get(edge.b) ?? 0) + 1);
  }
  return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
}

/**
 * Returns selected edges grouped around their shared vertices.
 * Actual corner construction stays separate so the edge kernel remains small.
 */
export function groupBevelEdgesAtCorners(mesh: Graphics3DMesh, selected: Set<string>): Map<number, string[]> {
  const result = new Map<number, string[]>();
  for (const vertex of sharedBevelVertices(mesh, selected)) {
    const edges = meshEdges(mesh)
      .filter(edge => (edge.a === vertex || edge.b === vertex) && selected.has(edgeKey(edge.a, edge.b)))
      .map(edge => edgeKey(edge.a, edge.b));
    if (edges.length > 1) result.set(vertex, edges);
  }
  return result;
}
