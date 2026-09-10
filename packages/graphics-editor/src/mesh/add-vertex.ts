import type { Graphics3DMesh } from "../types";

type Vec3 = [number, number, number];

/** Add an unconnected vertex and return its new vertex index. */
export function addVertex(mesh: Graphics3DMesh, position: Vec3): Graphics3DMesh {
  if (!position.every(Number.isFinite)) return mesh;
  const vertices = [...mesh.geometry.vertices, ...position];
  return { ...mesh, geometry: { ...mesh.geometry, vertices } };
}
