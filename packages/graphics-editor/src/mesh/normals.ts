import type { Graphics3DMesh } from "../types";

export function recalculateNormals(mesh: Graphics3DMesh): Graphics3DMesh {
  const { vertices, indices } = mesh.geometry;
  if (vertices.length % 3 !== 0) throw new Error("Mesh vertex buffer length must be divisible by 3");
  if (indices.length % 3 !== 0) throw new Error("Mesh index buffer length must be divisible by 3");

  const vertexCount = vertices.length / 3;
  const normals = new Array<number>(vertices.length).fill(0);

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i],
      b = indices[i + 1],
      c = indices[i + 2];
    if (![a, b, c].every(index => Number.isInteger(index) && index >= 0 && index < vertexCount)) {
      throw new Error("Mesh index buffer contains an invalid vertex index");
    }

    const ax = vertices[a * 3],
      ay = vertices[a * 3 + 1],
      az = vertices[a * 3 + 2];
    const bx = vertices[b * 3],
      by = vertices[b * 3 + 1],
      bz = vertices[b * 3 + 2];
    const cx = vertices[c * 3],
      cy = vertices[c * 3 + 1],
      cz = vertices[c * 3 + 2];

    const abx = bx - ax,
      aby = by - ay,
      abz = bz - az;
    const acx = cx - ax,
      acy = cy - ay,
      acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    normals[a * 3] += nx;
    normals[a * 3 + 1] += ny;
    normals[a * 3 + 2] += nz;
    normals[b * 3] += nx;
    normals[b * 3 + 1] += ny;
    normals[b * 3 + 2] += nz;
    normals[c * 3] += nx;
    normals[c * 3 + 1] += ny;
    normals[c * 3 + 2] += nz;
  }

  for (let i = 0; i < vertexCount; i++) {
    const offset = i * 3;
    const length = Math.hypot(normals[offset], normals[offset + 1], normals[offset + 2]);
    if (length > 1e-12) {
      normals[offset] /= length;
      normals[offset + 1] /= length;
      normals[offset + 2] /= length;
    }
  }

  return {
    ...mesh,
    geometry: {
      ...mesh.geometry,
      normals,
    },
  };
}

export function flipFaces(mesh: Graphics3DMesh, faceIds: Set<number>): Graphics3DMesh {
  if (!faceIds.size) return mesh;

  const indices = [...mesh.geometry.indices];
  for (const faceId of faceIds) {
    if (!Number.isInteger(faceId) || faceId < 0) continue;
    const offset = faceId * 3;
    if (offset + 2 >= indices.length) continue;
    [indices[offset + 1], indices[offset + 2]] = [indices[offset + 2], indices[offset + 1]];
  }

  return {
    ...mesh,
    geometry: {
      ...mesh.geometry,
      indices,
      normals: undefined,
    },
  };
}
