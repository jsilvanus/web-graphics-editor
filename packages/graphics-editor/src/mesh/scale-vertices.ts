import type { Graphics3DMesh } from "../types";

type Vec3 = [number, number, number];
/** Unit quaternion as [x, y, z, w]. */
type Quat = [number, number, number, number];

const IDENTITY: Quat = [0, 0, 0, 1];

function rotate([x, y, z]: Vec3, [qx, qy, qz, qw]: Quat): Vec3 {
  // v' = v + 2w(q × v) + 2(q × (q × v))
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + (qy * tz - qz * ty),
    y + qw * ty + (qz * tx - qx * tz),
    z + qw * tz + (qx * ty - qy * tx),
  ];
}

/**
 * Return a mesh with the supplied vertex indices scaled about `pivot`.
 * The scale is applied along the axes of `orientation`, so a face can be scaled in its own plane.
 */
export function scaleVertices(
  mesh: Graphics3DMesh,
  vertexIds: Iterable<number>,
  pivot: Vec3,
  scale: Vec3,
  orientation: Quat = IDENTITY,
): Graphics3DMesh {
  const vertices = [...mesh.geometry.vertices];
  const count = vertices.length / 3;
  const inverse: Quat = [-orientation[0], -orientation[1], -orientation[2], orientation[3]];

  for (const id of vertexIds) {
    if (!Number.isInteger(id) || id < 0 || id >= count) continue;
    const offset: Vec3 = [
      vertices[id * 3] - pivot[0],
      vertices[id * 3 + 1] - pivot[1],
      vertices[id * 3 + 2] - pivot[2],
    ];
    const local = rotate(offset, inverse);
    const scaled = rotate([local[0] * scale[0], local[1] * scale[1], local[2] * scale[2]], orientation);
    vertices[id * 3] = pivot[0] + scaled[0];
    vertices[id * 3 + 1] = pivot[1] + scaled[1];
    vertices[id * 3 + 2] = pivot[2] + scaled[2];
  }

  return { ...mesh, geometry: { ...mesh.geometry, vertices } };
}
