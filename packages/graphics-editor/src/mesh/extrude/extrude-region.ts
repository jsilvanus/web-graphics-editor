import type { Graphics3DMesh } from "../../types";
import { faceNormal, faceVertexIndices } from "../../3d-mesh-operations";

type Vec3 = [number, number, number];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
const normalize = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return n > 1e-8 ? scale(v, 1 / n) : [0, 1, 0];
};

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Extrudes a connected set of triangular faces as one region.
 * Interior edges are kept internal; only the region boundary receives side walls.
 * A single averaged normal is used for the duplicated top region so a flat
 * multi-face selection moves as a coherent modeling region.
 */
export function extrudeRegion(mesh: Graphics3DMesh, selectedFaces: Set<number>, distance: number): Graphics3DMesh {
  if (!selectedFaces.size || !Number.isFinite(distance)) return mesh;

  const faces = [...selectedFaces].filter(i => faceVertexIndices(mesh, i) !== null).sort((a, b) => a - b);
  if (!faces.length) return mesh;

  const faceIds = new Set(faces);
  const faceVertices = new Map<number, [number, number, number]>();
  const normals = new Map<number, Vec3>();
  const counts = new Map<number, number>();
  const edges = new Map<string, { a: number; b: number; faces: number[] }>();

  for (const face of faces) {
    const ids = faceVertexIndices(mesh, face)!;
    faceVertices.set(face, ids);
    const normal = faceNormal(mesh, face);
    if (normal) normals.set(face, normal);
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (let i = 0; i < 3; i++) {
      const a = ids[i], b = ids[(i + 1) % 3], key = edgeKey(a, b);
      const entry = edges.get(key) ?? { a, b, faces: [] };
      entry.faces.push(face);
      edges.set(key, entry);
    }
  }

  // One displacement per selected vertex. This gives adjacent selected faces
  // a shared top vertex while keeping the operation independent of face order.
  const vertexNormals = new Map<number, Vec3>();
  for (const [face, ids] of faceVertices) {
    const n = normals.get(face);
    if (!n) continue;
    for (const id of ids) vertexNormals.set(id, add(vertexNormals.get(id) ?? [0, 0, 0], n));
  }

  const vertices = [...mesh.geometry.vertices];
  const topId = new Map<number, number>();
  for (const id of vertexNormals.keys()) {
    const base = id * 3;
    const n = normalize(vertexNormals.get(id)!);
    const p: Vec3 = [mesh.geometry.vertices[base], mesh.geometry.vertices[base + 1], mesh.geometry.vertices[base + 2]];
    const v = add(p, scale(n, distance));
    topId.set(id, vertices.length / 3);
    vertices.push(...v);
  }

  const indices = [...mesh.geometry.indices];
  // Replace each selected face with its displaced counterpart.
  for (const face of faces) {
    const ids = faceVertices.get(face)!;
    const base = face * 3;
    indices[base] = topId.get(ids[0])!;
    indices[base + 1] = topId.get(ids[1])!;
    indices[base + 2] = topId.get(ids[2])!;
  }

  // Build walls only along the boundary of the selected region.
  for (const edge of edges.values()) {
    if (edge.faces.length !== 1 || !faceIds.has(edge.faces[0])) continue;
    const a = edge.a, b = edge.b;
    const ta = topId.get(a), tb = topId.get(b);
    if (ta === undefined || tb === undefined) continue;
    const face = faceVertices.get(edge.faces[0])!;
    const posA = face.indexOf(a), posB = face.indexOf(b);
    if ((posA + 1) % 3 === posB) indices.push(a, b, tb, a, tb, ta);
    else indices.push(a, tb, b, a, ta, tb);
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices, normals: undefined, uv: undefined } };
}
