import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges, type MeshEdge } from "../../3d-mesh-topology";

export interface BevelEdgeContext { edge: MeshEdge; faces: number[]; }

export function collectBevelEdges(mesh: Graphics3DMesh, keys: Set<string>): BevelEdgeContext[] {
  return meshEdges(mesh).filter(edge => keys.has(edgeKey(edge.a, edge.b))).map(edge => ({ edge, faces: edge.faces }));
}

export function faceCornerForEdge(mesh: Graphics3DMesh, face: number, a: number, b: number): number | undefined {
  const i = face * 3;
  const ids = [mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]];
  return ids.includes(a) && ids.includes(b) ? ids.find(id => id !== a && id !== b) : undefined;
}
