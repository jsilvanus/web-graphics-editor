import type { Graphics3DWorld } from "../types";

export type WorldOperation =
  | { type: "set-mesh-transform"; meshId: string; from: Graphics3DWorld["meshes"][number]["transform"]; to: Graphics3DWorld["meshes"][number]["transform"] }
  | { type: "set-camera-transform"; cameraId: string; from: { position: [number, number, number]; rotation: [number, number, number] }; to: { position: [number, number, number]; rotation: [number, number, number] } };

export interface WorldHistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  actor: string;
  operation: WorldOperation;
}

export interface WorldHistory {
  worldId: string;
  entries: WorldHistoryEntry[];
}

export function applyWorldOperation(world: Graphics3DWorld, operation: WorldOperation, reverse = false): Graphics3DWorld {
  if (operation.type === "set-mesh-transform") {
    const transform = reverse ? operation.from : operation.to;
    return { ...world, meshes: world.meshes.map(mesh => mesh.id === operation.meshId ? { ...mesh, transform } : mesh) };
  }
  const transform = reverse ? operation.from : operation.to;
  return {
    ...world,
    cameras: world.cameras.map(camera => camera.id === operation.cameraId ? { ...camera, position: transform.position, rotation: transform.rotation } : camera),
  };
}

export function invertWorldOperation(operation: WorldOperation): WorldOperation {
  if (operation.type === "set-mesh-transform") return { ...operation, from: operation.to, to: operation.from };
  return { ...operation, from: operation.to, to: operation.from };
}
