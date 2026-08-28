import type { Graphics3DMesh, Graphics3DTransform } from "./types";

const identity: Graphics3DTransform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
function mesh(id: string, vertices: number[], indices: number[], transform: Graphics3DTransform = identity): Graphics3DMesh { return { id, geometry: { vertices, indices }, transform: { position: [...transform.position] as [number, number, number], rotation: [...transform.rotation] as [number, number, number], scale: [...transform.scale] as [number, number, number] } }; }

/** Generate a renderer-independent cylinder with cap vertices. */
export function createCylinderMesh(id: string, radius = 0.5, height = 1, segments = 24, transform: Graphics3DTransform = identity): Graphics3DMesh {
  const n = Math.max(3, Math.floor(segments)), vertices: number[] = [], indices: number[] = [];
  for (let y = 0; y <= 1; y++) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; vertices.push(Math.cos(a) * radius, (y - 0.5) * height, Math.sin(a) * radius); }
  const bottom = vertices.length / 3; vertices.push(0, -height / 2, 0); const top = vertices.length / 3; vertices.push(0, height / 2, 0);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, b = i, bn = j, t = n + i, tn = n + j; indices.push(b, bn, t, bn, tn, t); indices.push(bottom, bn, b); indices.push(top, t, tn); }
  return mesh(id, vertices, indices, transform);
}

/** Generate a renderer-independent UV sphere. */
export function createSphereMesh(id: string, radius = 0.5, segments = 24, rings = 12, transform: Graphics3DTransform = identity): Graphics3DMesh {
  const s = Math.max(3, Math.floor(segments)), r = Math.max(2, Math.floor(rings)), vertices: number[] = [], indices: number[] = [];
  for (let y = 0; y <= r; y++) { const phi = y / r * Math.PI; for (let x = 0; x < s; x++) { const theta = x / s * Math.PI * 2; vertices.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)); } }
  for (let y = 0; y < r; y++) for (let x = 0; x < s; x++) { const a = y * s + x, b = y * s + (x + 1) % s, c = (y + 1) * s + x, d = (y + 1) * s + (x + 1) % s; if (y > 0) indices.push(a, c, b); if (y < r - 1) indices.push(b, c, d); }
  return mesh(id, vertices, indices, transform);
}

/** Generate a renderer-independent cone or frustum. */
export function createConeMesh(id: string, radius = 0.5, height = 1, segments = 24, radiusTop = 0, transform: Graphics3DTransform = identity): Graphics3DMesh {
  const n = Math.max(3, Math.floor(segments)), vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; vertices.push(Math.cos(a) * radius, -height / 2, Math.sin(a) * radius); }
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; vertices.push(Math.cos(a) * radiusTop, height / 2, Math.sin(a) * radiusTop); }
  const bottom = vertices.length / 3; vertices.push(0, -height / 2, 0); const top = vertices.length / 3; vertices.push(0, height / 2, 0);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; indices.push(i, j, n + i, j, n + j, n + i); indices.push(bottom, j, i); if (radiusTop > 0) indices.push(top, n + i, n + j); }
  return mesh(id, vertices, indices, transform);
}

/** Generate a renderer-independent cuboid mesh centered at the origin. */
export function createBoxMesh(id: string, width = 1, height = 1, depth = 1, transform: Graphics3DTransform = identity): Graphics3DMesh {
  const x = width / 2, y = height / 2, z = depth / 2;
  const vertices = [-x,-y,-z, x,-y,-z, x,y,-z, -x,y,-z, -x,-y,z, x,-y,z, x,y,z, -x,y,z];
  const indices = [0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5];
  return mesh(id, vertices, indices, transform);
}
