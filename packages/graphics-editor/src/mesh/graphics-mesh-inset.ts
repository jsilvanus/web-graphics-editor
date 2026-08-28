import type { Graphics3DMesh } from "../types";
import { graphicsMeshToHalfEdge, halfEdgeToGraphicsMesh } from "./graphics-mesh";
import { insetFace as insetTopologyFace, type InsetFaceResult } from "./inset-face";

export interface GraphicsMeshInsetResult {
  mesh: Graphics3DMesh;
  innerFaceId: number;
  innerVertexIds: number[];
  ringFaceIds: number[];
}

/** Inset a face of a Graphics3DMesh through the half-edge editing kernel. */
export function insetGraphicsMeshFace(mesh: Graphics3DMesh, faceId: number, amount: number): GraphicsMeshInsetResult {
  const topology = graphicsMeshToHalfEdge(mesh);
  const result: InsetFaceResult = insetTopologyFace(topology, faceId, amount);
  return {
    mesh: halfEdgeToGraphicsMesh(mesh, result.mesh),
    innerFaceId: result.faceId,
    innerVertexIds: result.innerVertexIds,
    ringFaceIds: result.ringFaceIds,
  };
}
