import type { Graphics3DMesh, Graphics3DTransform } from "./types";

function cloneTransform(transform: Graphics3DTransform): Graphics3DTransform {
  return { position: [...transform.position] as [number, number, number], rotation: [...transform.rotation] as [number, number, number], scale: [...transform.scale] as [number, number, number] };
}

function normal(a: number[], b: number[], c: number[]): [number, number, number] {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

/** Return a copy with selected local-space vertices moved. */
export function moveMeshVertices(mesh: Graphics3DMesh, vertexIds: number[], delta: [number, number, number]): Graphics3DMesh {
  const selected = new Set(vertexIds);
  const vertices = [...mesh.geometry.vertices];
  for (const id of selected) {
    const offset = id * 3;
    if (offset < 0 || offset + 2 >= vertices.length) continue;
    vertices[offset] += delta[0]; vertices[offset + 1] += delta[1]; vertices[offset + 2] += delta[2];
  }
  return { ...mesh, geometry: { ...mesh.geometry, vertices }, transform: cloneTransform(mesh.transform) };
}

/** Remove triangle faces and compact the now-unused vertices. */
export function deleteMeshFaces(mesh: Graphics3DMesh, faceIds: number[]): Graphics3DMesh {
  const removed = new Set(faceIds);
  const oldIndices = mesh.geometry.indices;
  const kept: number[] = [];
  for (let face = 0; face < oldIndices.length / 3; face++) if (!removed.has(face)) kept.push(oldIndices[face * 3], oldIndices[face * 3 + 1], oldIndices[face * 3 + 2]);
  return compactMesh(mesh, kept);
}

/** Merge vertices that are within tolerance, updating triangle indices. */
export function mergeMeshVertices(mesh: Graphics3DMesh, tolerance = 1e-6): Graphics3DMesh {
  const vertices = mesh.geometry.vertices;
  const map = new Array(vertices.length / 3).fill(-1) as number[];
  const compact: number[] = [];
  const limit = Math.max(tolerance, 0);
  for (let i = 0; i < map.length; i++) {
    const x = vertices[i * 3], y = vertices[i * 3 + 1], z = vertices[i * 3 + 2];
    let found = -1;
    for (let j = 0; j < compact.length / 3; j++) {
      if (Math.hypot(x - compact[j * 3], y - compact[j * 3 + 1], z - compact[j * 3 + 2]) <= limit) { found = j; break; }
    }
    if (found < 0) { found = compact.length / 3; compact.push(x, y, z); }
    map[i] = found;
  }
  return { ...mesh, geometry: { vertices: compact, indices: mesh.geometry.indices.map(index => map[index]) } };
}

/** Extrude one triangular face in local space, preserving the original face as the bottom cap. */
export function extrudeMeshFace(mesh: Graphics3DMesh, faceId: number, distance: number): Graphics3DMesh {
  const indices = mesh.geometry.indices;
  const base = faceId * 3;
  if (base < 0 || base + 2 >= indices.length) throw new Error(`Mesh face not found: ${faceId}`);
  const ids = [indices[base], indices[base + 1], indices[base + 2]];
  const v = mesh.geometry.vertices;
  const points = ids.map(id => [v[id * 3], v[id * 3 + 1], v[id * 3 + 2]]);
  const n = normal(points[0], points[1], points[2]);
  const vertices = [...v];
  const newIds = ids.map((_, i) => {
    const p = points[i]; const id = vertices.length / 3;
    vertices.push(p[0] + n[0] * distance, p[1] + n[1] * distance, p[2] + n[2] * distance); return id;
  });
  const next = [...indices, newIds[0], newIds[2], newIds[1]];
  next.push(ids[0], ids[1], newIds[1], ids[0], newIds[1], newIds[0]);
  next.push(ids[1], ids[2], newIds[2], ids[1], newIds[2], newIds[1]);
  next.push(ids[2], ids[0], newIds[0], ids[2], newIds[0], newIds[2]);
  return { ...mesh, geometry: { ...mesh.geometry, vertices, indices: next } };
}

function compactMesh(mesh: Graphics3DMesh, indices: number[]): Graphics3DMesh {
  const used = [...new Set(indices)];
  const map = new Map(used.map((old, next) => [old, next]));
  const vertices: number[] = [];
  for (const old of used) vertices.push(mesh.geometry.vertices[old * 3], mesh.geometry.vertices[old * 3 + 1], mesh.geometry.vertices[old * 3 + 2]);
  return { ...mesh, geometry: { vertices, indices: indices.map(index => map.get(index)!), } };
}
