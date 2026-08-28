import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import { validateHalfEdgeMesh } from "./validate";
import { insetPolygonConstantDistance } from "./inset-geometry";

export interface InsetFaceResult {
  mesh: HalfEdgeMesh;
  faceId: number;
  innerVertexIds: number[];
  ringFaceIds: number[];
}

/**
 * Inset one face by a constant distance in the face plane.
 * Distance is expressed in mesh units, not as a percentage of the face size.
 */
export function insetFace(mesh: HalfEdgeMesh, faceId: number, distance: number): InsetFaceResult {
  const face = mesh.faces.find(f => f.id === faceId && !f.boundary);
  if (!face) throw new Error(`Cannot inset missing face ${faceId}`);
  const polygons = polygonsFromHalfEdges(mesh);
  const polygon = polygons[faceId];
  if (!polygon || polygon.length < 3) throw new Error(`Face ${faceId} is not insettable`);

  const insetDistance = Math.max(0, distance);
  const positions = [...mesh.positions];
  const points = polygon.map(vertexId => [
    positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2],
  ] as [number, number, number]);
  const innerPoints = insetPolygonConstantDistance(points, insetDistance);

  const innerVertexIds = innerPoints.map(point => {
    const id = positions.length / 3;
    positions.push(point[0], point[1], point[2]);
    return id;
  });

  const nextFaces = polygons.map((current, index) => {
    if (index !== faceId) return current;
    const ringFaces = current.map((outer, i) => {
      const nextOuter = current[(i + 1) % current.length];
      const inner = innerVertexIds[i];
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
