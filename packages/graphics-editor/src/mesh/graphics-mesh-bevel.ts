import type { Graphics3DMesh } from "../types";

type Vec3 = [number, number, number];

/**
 * Applies a simple geometric bevel to selected mesh edges by moving the two
 * endpoint positions toward the edge interior. This is deliberately kept as
 * a small kernel; topology creation can be layered on later without coupling
 * it to selection/controller code.
 */
export function bevelMeshEdges(mesh: Graphics3DMesh, edgeKeys: Set<string>, amount: number): Graphics3DMesh {
  if (amount <= 0 || edgeKeys.size === 0) return mesh;
  const vertices = [...mesh.geometry.vertices];

  for (const [a, b] of meshEdges(mesh)) {
    if (!edgeKeys.has(edgeKey(a, b))) continue;
    const pa = vertex(mesh, a), pb = vertex(mesh, b);
    const direction = normalize(sub(pb, pa));
    const nextA = add(pa, scale(direction, amount));
    const nextB = add(pb, scale(direction, -amount));
    write(vertices, a, nextA);
    write(vertices, b, nextB);
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices } };
}

function meshEdges(mesh: Graphics3DMesh): Array<[number, number]> {
  const seen = new Set<string>();
  const result: Array<[number, number]> = [];
  for (let i = 0; i < mesh.geometry.indices.length; i += 3) {
    const face = [mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]];
    for (let j = 0; j < 3; j++) {
      const a = face[j], b = face[(j + 1) % 3], key = edgeKey(a, b);
      if (!seen.has(key)) { seen.add(key); result.push([a, b]); }
    }
  }
  return result;
}

function edgeKey(a: number, b: number): string { return `${Math.min(a, b)}:${Math.max(a, b)}`; }
function vertex(mesh: Graphics3DMesh, index: number): Vec3 { return [mesh.geometry.vertices[index * 3], mesh.geometry.vertices[index * 3 + 1], mesh.geometry.vertices[index * 3 + 2]]; }
function write(vertices: number[], index: number, value: Vec3): void { vertices[index * 3] = value[0]; vertices[index * 3 + 1] = value[1]; vertices[index * 3 + 2] = value[2]; }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function scale(a: Vec3, n: number): Vec3 { return [a[0] * n, a[1] * n, a[2] * n]; }
function normalize(a: Vec3): Vec3 { const n = Math.hypot(...a); return n > 1e-8 ? scale(a, 1 / n) : [0, 0, 0]; }
