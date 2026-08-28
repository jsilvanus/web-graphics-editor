import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import { validateHalfEdgeMesh } from "./validate";

export interface InsetFaceResult {
  mesh: HalfEdgeMesh;
  faceId: number;
  innerVertexIds: number[];
  ringFaceIds: number[];
}

/**
 * Inset one face toward its centroid.
 *
 * Amount is normalized to [0, 1]: 0 leaves the face unchanged and 1 collapses
 * the inset polygon to its centroid. The operation is intentionally face-local;
 * neighboring faces retain their original vertices, so a future extrude/bevel
 * operation can build on the new ring without introducing implicit global edits.
 */
export function insetFace(mesh: HalfEdgeMesh, faceId: number, amount: number): InsetFaceResult {
  const face = mesh.faces.find(f => f.id === faceId && !f.boundary);
  if (!face) throw new Error(`Cannot inset missing face ${faceId}`);
  const polygons = polygonsFromHalfEdges(mesh);
  const polygon = polygons[faceId];
  if (!polygon || polygon.length < 3) throw new Error(`Face ${faceId} is not insettable`);

  const t = Math.max(0, Math.min(0.999999, amount));
  const positions = [...mesh.positions];
  const centroid = polygon.reduce((sum, vertexId) => {
    sum[0] += positions[vertexId * 3];
    sum[1] += positions[vertexId * 3 + 1];
    sum[2] += positions[vertexId * 3 + 2];
    return sum;
  }, [0, 0, 0] as [number, number, number]);
  centroid[0] /= polygon.length;
  centroid[1] /= polygon.length;
  centroid[2] /= polygon.length;

  const innerVertexIds = polygon.map(vertexId => {
    const id = positions.length / 3;
    const x = positions[vertexId * 3];
    const y = positions[vertexId * 3 + 1];
    const z = positions[vertexId * 3 + 2];
    positions.push(
      x + (centroid[0] - x) * t,
      y + (centroid[1] - y) * t,
      z + (centroid[2] - z) * t,
    );
    return id;
  });

  const nextFaces = polygons.map((current, index) => {
    if (index !== faceId) return current;
    const ring = current.map((vertexId, i) => [vertexId, innerVertexIds[i]]);
    const ringFaces = ring.map(([outer, inner], i) => {
      const nextOuter = current[(i + 1) % current.length];
      const nextInner = innerVertexIds[(i + 1) % current.length];
      return [outer, nextOuter, nextInner, inner];
    });
    return [...ringFaces, innerVertexIds] as number[][];
  }).flat();

  const result = fromPolygons({ positions, faces: nextFaces });
  validateHalfEdgeMesh(result);

  const replacementStart = polygons.slice(0, faceId).reduce((sum, p) => sum + (p.length < 3 ? 0 : 1), 0);
  const ringFaceIds = Array.from({ length: polygon.length }, (_, i) => replacementStart + i);
  const newInnerFaceId = replacementStart + polygon.length;
  return { mesh: result, faceId: newInnerFaceId, innerVertexIds, ringFaceIds };
}
