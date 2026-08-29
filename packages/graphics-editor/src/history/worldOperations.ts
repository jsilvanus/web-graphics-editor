import type { Graphics3DCamera, Graphics3DLight, Graphics3DMaterial, Graphics3DMesh, Graphics3DWorld } from "../types";

export type WorldOperation =
  | { type: "add-mesh"; mesh: Graphics3DMesh; index?: number }
  | { type: "remove-mesh"; mesh: Graphics3DMesh; index: number }
  | { type: "update-mesh"; meshId: string; from: Partial<Graphics3DMesh>; to: Partial<Graphics3DMesh> }
  | { type: "set-mesh-transform"; meshId: string; from: Graphics3DMesh["transform"]; to: Graphics3DMesh["transform"] }
  | { type: "add-camera"; camera: Graphics3DCamera; index?: number }
  | { type: "remove-camera"; camera: Graphics3DCamera; index: number }
  | { type: "update-camera"; cameraId: string; from: Partial<Graphics3DCamera>; to: Partial<Graphics3DCamera> }
  | { type: "set-camera-transform"; cameraId: string; from: Pick<Graphics3DCamera, "position" | "rotation">; to: Pick<Graphics3DCamera, "position" | "rotation"> }
  | { type: "add-light"; light: Graphics3DLight; index?: number }
  | { type: "remove-light"; light: Graphics3DLight; index: number }
  | { type: "update-light"; lightId: string; from: Partial<Graphics3DLight>; to: Partial<Graphics3DLight> }
  | { type: "add-material"; meshId: string; material: Graphics3DMaterial }
  | { type: "remove-material"; meshId: string; material: Graphics3DMaterial }
  | { type: "update-material"; meshId: string; from?: Graphics3DMaterial; to?: Graphics3DMaterial };

export interface WorldHistoryEntry { id: string; timestamp: number; label: string; actor: string; operation: WorldOperation }
export interface WorldHistory { worldId: string; entries: WorldHistoryEntry[] }

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>, index = -1): T[] {
  return items.map((item, i) => item.id === id ? { ...item, ...patch } : item);
}
function insert<T>(items: T[], value: T, index?: number): T[] { const next = [...items]; next.splice(Math.max(0, Math.min(index ?? next.length, next.length)), 0, value); return next; }
function remove<T extends { id: string }>(items: T[], id: string): T[] { return items.filter(item => item.id !== id); }

export function applyWorldOperation(world: Graphics3DWorld, operation: WorldOperation, reverse = false): Graphics3DWorld {
  if (operation.type === "add-mesh") return { ...world, meshes: reverse ? remove(world.meshes, operation.mesh.id) : insert(world.meshes, operation.mesh, operation.index) };
  if (operation.type === "remove-mesh") return { ...world, meshes: reverse ? insert(world.meshes, operation.mesh, operation.index) : remove(world.meshes, operation.mesh.id) };
  if (operation.type === "update-mesh") { const patch = reverse ? operation.from : operation.to; return { ...world, meshes: updateById(world.meshes, operation.meshId, patch) }; }
  if (operation.type === "set-mesh-transform") { const transform = reverse ? operation.from : operation.to; return { ...world, meshes: world.meshes.map(mesh => mesh.id === operation.meshId ? { ...mesh, transform } : mesh) }; }
  if (operation.type === "add-camera") return { ...world, cameras: reverse ? remove(world.cameras, operation.camera.id) : insert(world.cameras, operation.camera, operation.index) };
  if (operation.type === "remove-camera") return { ...world, cameras: reverse ? insert(world.cameras, operation.camera, operation.index) : remove(world.cameras, operation.camera.id) };
  if (operation.type === "update-camera") { const patch = reverse ? operation.from : operation.to; return { ...world, cameras: updateById(world.cameras, operation.cameraId, patch) }; }
  if (operation.type === "set-camera-transform") { const transform = reverse ? operation.from : operation.to; return { ...world, cameras: world.cameras.map(camera => camera.id === operation.cameraId ? { ...camera, ...transform } : camera) }; }
  if (operation.type === "add-light") return { ...world, lights: reverse ? remove(world.lights ?? [], operation.light.id) : insert(world.lights ?? [], operation.light, operation.index) };
  if (operation.type === "remove-light") return { ...world, lights: reverse ? insert(world.lights ?? [], operation.light, operation.index) : remove(world.lights ?? [], operation.light.id) };
  if (operation.type === "update-light") { const patch = reverse ? operation.from : operation.to; return { ...world, lights: updateById(world.lights ?? [], operation.lightId, patch) }; }
  const mesh = world.meshes.find(m => m.id === operation.meshId); if (!mesh) return world;
  if (operation.type === "add-material") return { ...world, meshes: world.meshes.map(m => m.id === operation.meshId ? { ...m, material: reverse ? undefined : operation.material } : m) };
  return { ...world, meshes: world.meshes.map(m => m.id === operation.meshId ? { ...m, material: reverse ? operation.material : undefined } : m) };
}

export function invertWorldOperation(operation: WorldOperation): WorldOperation {
  switch (operation.type) {
    case "add-mesh": return { type: "remove-mesh", mesh: operation.mesh, index: operation.index ?? 0 };
    case "remove-mesh": return { type: "add-mesh", mesh: operation.mesh, index: operation.index };
    case "add-camera": return { type: "remove-camera", camera: operation.camera, index: operation.index ?? 0 };
    case "remove-camera": return { type: "add-camera", camera: operation.camera, index: operation.index };
    case "add-light": return { type: "remove-light", light: operation.light, index: operation.index ?? 0 };
    case "remove-light": return { type: "add-light", light: operation.light, index: operation.index };
    case "add-material": return { type: "remove-material", meshId: operation.meshId, material: operation.material };
    case "remove-material": return { type: "add-material", meshId: operation.meshId, material: operation.material };
    case "update-material": return { ...operation, from: operation.to, to: operation.from };
    case "update-mesh": return { ...operation, from: operation.to, to: operation.from };
    case "update-camera": return { ...operation, from: operation.to, to: operation.from };
    case "update-light": return { ...operation, from: operation.to, to: operation.from };
    case "set-mesh-transform": return { ...operation, from: operation.to, to: operation.from };
    case "set-camera-transform": return { ...operation, from: operation.to, to: operation.from };
  }
}
