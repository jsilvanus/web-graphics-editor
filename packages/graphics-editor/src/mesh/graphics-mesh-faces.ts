import type { Graphics3DMesh } from "../types";
import { addFace } from "./add-face";
import { deleteFace } from "./delete-face";
import { graphicsMeshToHalfEdge, halfEdgeToGraphicsMesh } from "./graphics-mesh";

/** Add a triangular face to an editable Graphics3DMesh. */
export function addGraphicsMeshFace(
  mesh: Graphics3DMesh,
  vertices: [number, number, number],
): Graphics3DMesh {
  return halfEdgeToGraphicsMesh(mesh, addFace(graphicsMeshToHalfEdge(mesh), vertices));
}

/** Delete one face from an editable Graphics3DMesh without compacting vertices. */
export function deleteGraphicsMeshFace(mesh: Graphics3DMesh, faceId: number): Graphics3DMesh {
  return halfEdgeToGraphicsMesh(mesh, deleteFace(graphicsMeshToHalfEdge(mesh), faceId));
}
