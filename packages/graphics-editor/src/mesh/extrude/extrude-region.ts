import type { Graphics3DMesh } from "../../types";
import { faceNormal, faceVertexIndices } from "../../3d-mesh-operations";

type Vec3 = [number, number, number];
type Edge = { a: number; b: number; faces: number[] };

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
 * Extrudes selected triangular faces as independent connected regions.
 * Faces connected by an edge share their top vertices and use one averaged
 * normal. Faces that merely touch at a vertex remain separate regions.
 */
export function extrudeRegion(mesh: Graphics3DMesh, selectedFaces: Set<number>, distance: number): Graphics3DMesh {
  if (!selectedFaces.size || !Number.isFinite(distance)) return mesh;

  const faceVertices = new Map<number, [number, number, number]>();
  const normals = new Map<number, Vec3>();
  const edges = new Map<string, Edge>();

  for (const face of [...selectedFaces].sort((a, b) => a - b)) {
    const ids = faceVertexIndices(mesh, face);
    if (!ids) continue;
    faceVertices.set(face, ids);
    const normal = faceNormal(mesh, face);
    if (normal) normals.set(face, normal);
    for (let i = 0; i < 3; i++) {
      const a = ids[i], b = ids[(i + 1) % 3], key = edgeKey(a, b);
      const entry = edges.get(key) ?? { a, b, faces: [] };
      entry.faces.push(face);
      edges.set(key, entry);
    }
  }

  const faces = [...faceVertices.keys()];
  if (!faces.length) return mesh;

  // Connected components are defined by shared edges, not shared vertices.
  const adjacency = new Map<number, Set<number>>();
  for (const face of faces) adjacency.set(face, new Set());
  for (const edge of edges.values()) {
    if (edge.faces.length < 2) continue;
    for (const a of edge.faces) for (const b of edge.faces) {
      if (a !== b) adjacency.get(a)?.add(b);
    }
  }

  const components: number[][] = [];
  const componentOf = new Map<number, number>();
  const visited = new Set<number>();
  for (const start of faces) {
    if (visited.has(start)) continue;
    const component: number[] = [];
    const queue = [start];
    visited.add(start);
    while (queue.length) {
      const face = queue.shift()!;
      componentOf.set(face, components.length);
      component.push(face);
      for (const next of adjacency.get(face) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }
    component.sort((a, b) => a - b);
    components.push(component);
  }

  const componentNormals = components.map(component => {
    let sum: Vec3 = [0, 0, 0];
    for (const face of component) {
      const normal = normals.get(face);
      if (normal) sum = add(sum, normal);
    }
    return normalize(sum);
  });

  const vertices = [...mesh.geometry.vertices];
  // Component + vertex is intentional: vertex-only touching regions must not
  // accidentally share a displaced vertex.
  const topId = new Map<string, number>();
  for (const [face, ids] of faceVertices) {
    const component = componentOf.get(face)!;
    const normal = componentNormals[component];
    for (const id of ids) {
      const key = `${component}:${id}`;
      if (topId.has(key)) continue;
      const base = id * 3;
      const p: Vec3 = [mesh.geometry.vertices[base], mesh.geometry.vertices[base + 1], mesh.geometry.vertices[base + 2]];
      topId.set(key, vertices.length / 3);
      vertices.push(...add(p, scale(normal, distance)));
    }
  }

  const topVertex = (face: number, id: number): number => topId.get(`${componentOf.get(face)}:${id}`)!;
  const indices = [...mesh.geometry.indices];

  for (const face of faces) {
    const ids = faceVertices.get(face)!;
    const base = face * 3;
    indices[base] = topVertex(face, ids[0]);
    indices[base + 1] = topVertex(face, ids[1]);
    indices[base + 2] = topVertex(face, ids[2]);
  }

  // Only selected-region boundary edges receive side walls.
  for (const edge of edges.values()) {
    if (edge.faces.length !== 1) continue;
    const face = edge.faces[0];
    const ids = faceVertices.get(face)!;
    const ta = topVertex(face, edge.a), tb = topVertex(face, edge.b);
    const posA = ids.indexOf(edge.a), posB = ids.indexOf(edge.b);
    if ((posA + 1) % 3 === posB) indices.push(edge.a, edge.b, tb, edge.a, tb, ta);
    else indices.push(edge.a, tb, edge.b, edge.a, ta, tb);
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices, normals: undefined, uv: undefined } };
}
