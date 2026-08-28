import type { HalfEdgeMesh } from "./half-edge";

export function faceVertices(mesh: HalfEdgeMesh, faceId: number): number[] {
  const face = mesh.faces.find(f => f.id === faceId);
  if (!face) return [];
  const result: number[] = [];
  let h = face.halfEdge;
  const start = h;
  do { result.push(mesh.halfEdges[h].vertex); h = mesh.halfEdges[h].next; } while (h !== start);
  return result;
}

export function faceHalfEdges(mesh: HalfEdgeMesh, faceId: number): number[] {
  const face = mesh.faces.find(f => f.id === faceId);
  if (!face) return [];
  const result: number[] = [];
  let h = face.halfEdge;
  const start = h;
  do { result.push(h); h = mesh.halfEdges[h].next; } while (h !== start);
  return result;
}

export function edgeFaces(mesh: HalfEdgeMesh, edgeId: number): number[] {
  const edge = mesh.edges.find(e => e.id === edgeId);
  if (!edge) return [];
  const h = mesh.halfEdges[edge.halfEdge];
  return h.twin === null ? [h.face] : [h.face, mesh.halfEdges[h.twin].face];
}

export function vertexNeighbors(mesh: HalfEdgeMesh, vertexId: number): number[] {
  const result = new Set<number>();
  for (const h of mesh.halfEdges) {
    if (h.vertex !== vertexId) continue;
    result.add(mesh.halfEdges[h.next].vertex);
    if (h.twin !== null) result.add(h.vertex);
  }
  result.delete(vertexId);
  return [...result];
}

export function edgeIdForVertices(mesh: HalfEdgeMesh, a: number, b: number): number | null {
  for (const edge of mesh.edges) {
    const h = mesh.halfEdges[edge.halfEdge];
    const v = mesh.halfEdges[h.next].vertex;
    if ((h.vertex === a && v === b) || (h.vertex === b && v === a)) return edge.id;
  }
  return null;
}
