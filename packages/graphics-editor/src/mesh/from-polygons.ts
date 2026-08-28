import type { HalfEdgeMesh, PolygonMeshInput } from "./half-edge";

/** Build a manifold-oriented half-edge mesh from polygon faces. Boundary twins are null. */
export function fromPolygons(input: PolygonMeshInput): HalfEdgeMesh {
  const vertices = input.positions.filter((_, i) => i % 3 === 0).map((_, id) => ({ id, halfEdge: null }));
  const halfEdges: HalfEdgeMesh["halfEdges"] = [];
  const faces: HalfEdgeMesh["faces"] = [];
  const edges: HalfEdgeMesh["edges"] = [];
  const directed = new Map<string, number>();
  const undirected = new Map<string, number>();
  const key = (a: number, b: number) => `${a}:${b}`;
  const undirectedKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;

  input.faces.forEach((polygon, faceId) => {
    if (polygon.length < 3) return;
    const start = halfEdges.length;
    const hes = polygon.map((vertex, i) => {
      const id = start + i;
      const next = start + ((i + 1) % polygon.length);
      if (vertices[vertex]) vertices[vertex].halfEdge ??= id;
      return { id, vertex, twin: null, next, face: faceId };
    });
    halfEdges.push(...hes);
    faces.push({ id: faceId, halfEdge: start, boundary: false });
    for (const h of hes) {
      const nextVertex = halfEdges[h.next].vertex;
      const reverse = directed.get(key(nextVertex, h.vertex));
      if (reverse !== undefined) {
        h.twin = reverse;
        halfEdges[reverse].twin = h.id;
      }
      directed.set(key(h.vertex, nextVertex), h.id);
      const eKey = undirectedKey(h.vertex, nextVertex);
      if (!undirected.has(eKey)) {
        const edgeId = edges.length;
        undirected.set(eKey, edgeId);
        edges.push({ id: edgeId, halfEdge: h.id });
      }
    }
  });
  return { vertices, edges, faces, halfEdges, positions: [...input.positions] };
}

export function polygonsFromHalfEdges(mesh: HalfEdgeMesh): number[][] {
  return mesh.faces.filter(f => !f.boundary).map(face => {
    const result: number[] = [];
    let h = face.halfEdge;
    do { result.push(mesh.halfEdges[h].vertex); h = mesh.halfEdges[h].next; } while (h !== face.halfEdge);
    return result;
  });
}
