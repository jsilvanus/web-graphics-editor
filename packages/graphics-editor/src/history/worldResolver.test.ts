import { describe, expect, it } from "vitest";
import type { Graphics3DWorld, GraphicsDocument } from "../types";
import type { HistoryEntry } from "./operations";
import { createWorldHistoryStore, resolveHistoryEntry } from "./worldResolver";
import type { WorldHistory } from "./worldOperations";

const world: Graphics3DWorld = {
  id: "world-1",
  meshes: [{ id: "mesh-1", geometry: { vertices: [], indices: [] }, transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }],
  cameras: [],
};
const document: GraphicsDocument = { width: 100, height: 100, layers: [], worlds3d: [world] };

const worldOperation = {
  type: "set-mesh-transform" as const,
  meshId: "mesh-1",
  from: world.meshes[0].transform,
  to: { position: [10, 20, 30] as [number, number, number], rotation: [0, 1, 0] as [number, number, number], scale: [2, 2, 2] as [number, number, number] },
};
const history: WorldHistory = { worldId: "world-1", entries: [{ id: "world-op-1", timestamp: 1, label: "Move mesh", actor: "human", operation: worldOperation }] };
const entry: HistoryEntry = { id: "project-op-1", timestamp: 2, label: "Move mesh in world", actor: "human", operation: { type: "world-operation", worldId: "world-1", operationId: "world-op-1" } };

describe("world history resolver", () => {
  it("resolves a project history reference to the authoritative world operation", () => {
    const worlds = new Map([[world.id, world]]);
    const result = resolveHistoryEntry(document, entry, worlds, createWorldHistoryStore([history]));
    expect(result.worlds3d?.[0].meshes[0].transform).toEqual(worldOperation.to);
    expect(worlds.get("world-1")?.meshes[0].transform).toEqual(worldOperation.to);
  });

  it("undoes the referenced world operation", () => {
    const changed = resolveHistoryEntry(document, entry, new Map([[world.id, world]]), createWorldHistoryStore([history]));
    const worlds = new Map([[world.id, changed.worlds3d![0]]]);
    const result = resolveHistoryEntry(changed, entry, worlds, createWorldHistoryStore([history]), true);
    expect(result.worlds3d?.[0].meshes[0].transform).toEqual(worldOperation.from);
  });

  it("fails clearly for missing world or operation", () => {
    expect(() => resolveHistoryEntry(document, entry, new Map(), createWorldHistoryStore([]))).toThrow("3D world not found");
    expect(() => resolveHistoryEntry(document, entry, new Map([[world.id, world]]), createWorldHistoryStore([{ worldId: world.id, entries: [] }]))).toThrow("3D world operation not found");
  });
});
