import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";

export interface SplitFaceResult { mesh: HalfEdgeMesh; edgeId: number; faceId: number; newFaceId: number; }

/** Insert a diagonal between two non-adjacent vertices of one polygon face. */
export function splitFace(mesh: HalfEdgeMesh, faceId: number, vertexA: number, vertexB: number): SplitFaceResult {
  const face = mesh.faces.find(f => f.id === faceId && !f.boundary);
  if (!face) throw new Error(`Cannot split missing face ${faceId}`);
  if (vertexA === vertexB) throw new Error("A face split requires two distinct vertices");

  const polygons = polygonsFromHalfEdges(mesh);
  const polygon = polygons[faceId];
  if (!polygon) throw new Error(`Cannot split face ${faceId}: polygon not found`);
  const a = polygon.indexOf(vertexA), b = polygon.indexOf(vertexB);
  if (a < 0 || b < 0) throw new Error("Both split vertices must belong to the face");
  if ((a + 1) % polygon.length === b || (b + 1) % polygon.length === a) {
    throw new Error("Cannot split a face along an existing boundary edge");
  }

  const first = walkPolygon(polygon, a, b);
  const second = walkPolygon(polygon, b, a);
  if (first.length < 3 || second.length < 3) throw new Error("Face split would create a degenerate face");

  const nextPolygons = polygons.map((p, index) => index === faceId ? first : p);
  nextPolygons.push(second);
  const next = fromPolygons({ positions: mesh.positions, faces: nextPolygons });
  const edgeId = findEdge(next, vertexA, vertexB);
  return { mesh: next, edgeId, faceId, newFaceId: next.faces.length - 1 };
}

function walkPolygon(polygon: number[], start: number, end: number): number[] {
  const result: number[] = [];
  let index = start;
  while (true) {
    result.push(polygon[index]);
    if (index === end) return result;
    index = (index + 1) % polygon.length;
  }
}

function findEdge(mesh: HalfEdgeMesh, a: number, b: number): number {
  const halfEdge = mesh.halfEdges.find(h => {
    const nextVertex = mesh.halfEdges[h.next].vertex;
    return (h.vertex === a && nextVertex === b) || (h.vertex === b && nextVertex === a);
  });
  if (!halfEdge) throw new Error("Face split did not create the requested edge");
  return mesh.edges.find(edge => edge.halfEdge === halfEdge.id || mesh.halfEdges[edge.halfEdge].twin === halfEdge.id)?.id ?? -1;
}
