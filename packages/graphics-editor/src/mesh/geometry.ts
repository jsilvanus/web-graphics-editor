import type { Graphics3DMesh } from "../types";
import type { HalfEdgeMesh } from "./half-edge";
import { polygonsFromHalfEdges } from "./from-polygons";

export function halfEdgeToTriangleGeometry(mesh: HalfEdgeMesh): { vertices:number[]; indices:number[] } {
  const indices:number[]=[];
  for (const polygon of polygonsFromHalfEdges(mesh)) {
    for (let i=1;i<polygon.length-1;i++) indices.push(polygon[0],polygon[i],polygon[i+1]);
  }
  return { vertices:[...mesh.positions], indices };
}

export function geometryFromMesh(mesh: Graphics3DMesh): { vertices:number[]; indices:number[] } {
  return { vertices:[...mesh.geometry.vertices], indices:[...mesh.geometry.indices] };
}
