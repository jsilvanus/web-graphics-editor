import type { Graphics3DMesh, Graphics3DTransform } from "./types";

const identity: Graphics3DTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

/** Generate a renderer-independent cuboid mesh centered at the origin. */
export function createBoxMesh(id: string, width = 1, height = 1, depth = 1, transform: Graphics3DTransform = identity): Graphics3DMesh {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const vertices = [
    -x,-y,-z, x,-y,-z, x,y,-z, -x,y,-z,
    -x,-y,z,  x,-y,z,  x,y,z,  -x,y,z,
  ];
  const indices = [
    0,2,1, 0,3,2,
    4,5,6, 4,6,7,
    0,1,5, 0,5,4,
    2,3,7, 2,7,6,
    0,4,7, 0,7,3,
    1,2,6, 1,6,5,
  ];
  return { id, geometry: { vertices, indices }, transform };
}
