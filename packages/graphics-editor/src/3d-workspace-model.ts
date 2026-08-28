import type { Graphics3DCamera, Graphics3DMesh, Graphics3DWorld } from "./types";

export function updateWorldMesh(world: Graphics3DWorld, id: string, patch: Partial<Omit<Graphics3DMesh, "id">>): Graphics3DWorld {
  return { ...world, meshes: world.meshes.map(mesh => mesh.id === id ? { ...mesh, ...patch } : mesh) };
}

export function updateWorldCamera(world: Graphics3DWorld, id: string, patch: Partial<Omit<Graphics3DCamera, "id">>): Graphics3DWorld {
  return { ...world, cameras: world.cameras.map(camera => camera.id === id ? { ...camera, ...patch } : camera) };
}
