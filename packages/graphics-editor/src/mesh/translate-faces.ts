import type { Graphics3DMesh } from "../types";
import { faceVertexIndices } from "../mesh/3d-mesh-operations";
import { moveVertices } from "./move-vertices";

type Vec3 = [number, number, number];

/** Translate every unique vertex belonging to the selected faces by the same delta. */
export function translateFaces(mesh: Graphics3DMesh, faceIds: Iterable<number>, delta: Vec3): Graphics3DMesh {
  const vertexIds = new Set<number>();

  for (const face of faceIds) {
    if (!Number.isInteger(face) || face < 0) continue;
    faceVertexIndices(mesh, face)?.forEach(id => vertexIds.add(id));
  }

  return vertexIds.size ? moveVertices(mesh, vertexIds, delta) : mesh;
}
