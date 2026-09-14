import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";

/** Delete one face while preserving all vertex positions and indices. */
export function deleteFace(mesh: HalfEdgeMesh, faceId: number): HalfEdgeMesh {
  if (!Number.isInteger(faceId) || faceId < 0 || faceId >= mesh.faces.length) {
    throw new Error(`Cannot delete missing face ${faceId}`);
  }
  const face = mesh.faces.find(face => face.id === faceId && !face.boundary);
  if (!face) throw new Error(`Cannot delete missing face ${faceId}`);

  const polygons = polygonsFromHalfEdges(mesh);
  const polygon = polygons[faceId];
  if (!polygon) throw new Error(`Cannot delete face ${faceId}: polygon not found`);

  return fromPolygons({
    positions: mesh.positions,
    faces: polygons.filter((_, index) => index !== faceId),
  });
}
