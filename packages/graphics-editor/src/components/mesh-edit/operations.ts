import type { Graphics3DMesh } from "../../types";
import { extrudeFace } from "../../3d-mesh-operations";
import { bevelEdges, insetFace as insetFaceLegacy } from "../../3d-mesh-topology";
import { insetGraphicsMeshFace } from "../../mesh/graphics-mesh-inset";

export function insetKernel(data: Graphics3DMesh, faces: Set<number>, amount: number): Graphics3DMesh {
  let next = data;
  for (const face of [...faces].sort((a, b) => b - a)) {
    try { next = insetGraphicsMeshFace(next, face, amount).mesh; }
    catch (error) { console.warn(`Half-edge inset failed for face ${face}; leaving that face unchanged`, error); }
  }
  return next;
}

export function insetLegacy(data: Graphics3DMesh, faces: Set<number>, amount: number): Graphics3DMesh {
  let next = data;
  for (const face of faces) next = insetFaceLegacy(next, face, amount);
  return next;
}

export function extrude(data: Graphics3DMesh, faces: Set<number>, distance: number): Graphics3DMesh {
  let next = data;
  for (const face of [...faces].sort((a, b) => b - a)) next = extrudeFace(next, face, distance);
  return next;
}

export function bevel(data: Graphics3DMesh, edges: Set<string>, amount: number): Graphics3DMesh {
  return bevelEdges(data, edges, amount);
}
