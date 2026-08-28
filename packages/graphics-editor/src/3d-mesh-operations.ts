import type { Graphics3DMesh } from "./types";

type Vec3 = [number, number, number];

const vertex = (g: Graphics3DMesh["geometry"], index: number): Vec3 => [g.vertices[index * 3], g.vertices[index * 3 + 1], g.vertices[index * 3 + 2]];
const addVertex = (vertices: number[], v: Vec3) => { const i = vertices.length / 3; vertices.push(...v); return i; };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const normalize = (v: Vec3): Vec3 => { const n = length(v); return n > 1e-8 ? [v[0] / n, v[1] / n, v[2] / n] : [0, 1, 0]; };

export function faceVertexIndices(mesh: Graphics3DMesh, faceIndex: number): [number, number, number] | null {
  const i = faceIndex * 3;
  if (i < 0 || i + 2 >= mesh.geometry.indices.length) return null;
  return [mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]];
}

export function faceNormal(mesh: Graphics3DMesh, faceIndex: number): Vec3 | null {
  const ids = faceVertexIndices(mesh, faceIndex); if (!ids) return null;
  return normalize(cross(sub(vertex(mesh.geometry, ids[1]), vertex(mesh.geometry, ids[0])), sub(vertex(mesh.geometry, ids[2]), vertex(mesh.geometry, ids[0]))));
}

export function translateFace(mesh: Graphics3DMesh, faceIndex: number, delta: Vec3): Graphics3DMesh {
  const ids = faceVertexIndices(mesh, faceIndex); if (!ids) return mesh;
  const vertices = [...mesh.geometry.vertices];
  for (const id of ids) { vertices[id * 3] += delta[0]; vertices[id * 3 + 1] += delta[1]; vertices[id * 3 + 2] += delta[2]; }
  return { ...mesh, geometry: { ...mesh.geometry, vertices } };
}

export function extrudeFace(mesh: Graphics3DMesh, faceIndex: number, distance: number): Graphics3DMesh {
  const ids = faceVertexIndices(mesh, faceIndex); const normal = faceNormal(mesh, faceIndex); if (!ids || !normal) return mesh;
  const vertices = [...mesh.geometry.vertices];
  const a = vertex(mesh.geometry, ids[0]), b = vertex(mesh.geometry, ids[1]), c = vertex(mesh.geometry, ids[2]);
  const offset: Vec3 = [normal[0] * distance, normal[1] * distance, normal[2] * distance];
  const na = addVertex(vertices, [a[0] + offset[0], a[1] + offset[1], a[2] + offset[2]]);
  const nb = addVertex(vertices, [b[0] + offset[0], b[1] + offset[1], b[2] + offset[2]]);
  const nc = addVertex(vertices, [c[0] + offset[0], c[1] + offset[1], c[2] + offset[2]]);
  const indices = [...mesh.geometry.indices];
  const base = faceIndex * 3;
  indices[base] = na; indices[base + 1] = nb; indices[base + 2] = nc;
  indices.push(ids[0], ids[1], nb, ids[0], nb, na, ids[1], ids[2], nc, ids[1], nc, nb, ids[2], ids[0], na, ids[2], na, nc);
  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices } };
}
