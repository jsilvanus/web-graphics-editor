import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DView, Graphics3DWorld, GraphicsDocument, Graphics3DVisibility, Provenance } from "./types";

export function create3DWorld(document: GraphicsDocument, world: Graphics3DWorld): GraphicsDocument {
  if (document.worlds3d?.some(item => item.id === world.id)) throw new Error(`3D world already exists: ${world.id}`);
  return { ...document, worlds3d: [...(document.worlds3d ?? []), world] };
}

export function update3DWorld(document: GraphicsDocument, id: string, patch: Partial<Omit<Graphics3DWorld, "id">>): GraphicsDocument {
  return { ...document, worlds3d: (document.worlds3d ?? []).map(world => world.id === id ? { ...world, ...patch } : world) };
}

export function remove3DWorld(document: GraphicsDocument, id: string): GraphicsDocument {
  return { ...document, worlds3d: (document.worlds3d ?? []).filter(world => world.id !== id), views3d: (document.views3d ?? []).filter(view => view.worldId !== id) };
}

function mapWorld(document: GraphicsDocument, worldId: string, fn: (world: Graphics3DWorld) => Graphics3DWorld): GraphicsDocument {
  return { ...document, worlds3d: (document.worlds3d ?? []).map(world => world.id === worldId ? fn(world) : world) };
}

export function add3DMesh(document: GraphicsDocument, worldId: string, mesh: Graphics3DMesh): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, meshes: [...world.meshes, mesh] }));
}

export function update3DMesh(document: GraphicsDocument, worldId: string, meshId: string, patch: Partial<Omit<Graphics3DMesh, "id">>): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, meshes: world.meshes.map(mesh => mesh.id === meshId ? { ...mesh, ...patch } : mesh) }));
}

export function remove3DMesh(document: GraphicsDocument, worldId: string, meshId: string): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, meshes: world.meshes.filter(mesh => mesh.id !== meshId) }));
}

export function add3DCamera(document: GraphicsDocument, worldId: string, camera: Graphics3DCamera): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, cameras: [...world.cameras, camera] }));
}

export function update3DCamera(document: GraphicsDocument, worldId: string, cameraId: string, patch: Partial<Omit<Graphics3DCamera, "id">>): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, cameras: world.cameras.map(camera => camera.id === cameraId ? { ...camera, ...patch } : camera) }));
}

export function remove3DCamera(document: GraphicsDocument, worldId: string, cameraId: string): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, cameras: world.cameras.filter(camera => camera.id !== cameraId) }));
}

export function add3DLight(document: GraphicsDocument, worldId: string, light: Graphics3DLight): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, lights: [...(world.lights ?? []), light] }));
}

export function remove3DLight(document: GraphicsDocument, worldId: string, lightId: string): GraphicsDocument {
  return mapWorld(document, worldId, world => ({ ...world, lights: (world.lights ?? []).filter(light => light.id !== lightId) }));
}

export function create3DView(document: GraphicsDocument, view: Graphics3DView): GraphicsDocument {
  if (!document.worlds3d?.some(world => world.id === view.worldId)) throw new Error(`3D world not found: ${view.worldId}`);
  return { ...document, views3d: [...(document.views3d ?? []), view] };
}

export function update3DView(document: GraphicsDocument, id: string, patch: Partial<Omit<Graphics3DView, "id">>): GraphicsDocument {
  return { ...document, views3d: (document.views3d ?? []).map(view => view.id === id ? { ...view, ...patch } : view) };
}

export function remove3DView(document: GraphicsDocument, id: string): GraphicsDocument {
  return { ...document, views3d: (document.views3d ?? []).filter(view => view.id !== id) };
}

export function set3DViewVisibility(document: GraphicsDocument, viewId: string, visibility: Graphics3DVisibility): GraphicsDocument {
  return update3DView(document, viewId, { visibility });
}

export function setProvenance<T extends { provenance?: Provenance }>(value: T, provenance: Provenance): T {
  return { ...value, provenance };
}
