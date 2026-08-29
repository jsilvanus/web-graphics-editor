import type { Graphics3DWorld, GraphicsDocument } from "../types";
import type { DocumentOperation, HistoryEntry } from "./operations";
import { applyOperation } from "./operations";
import type { WorldHistory } from "./worldOperations";
import { applyWorldOperation } from "./worldOperations";

export interface WorldHistoryStore {
  get(worldId: string): WorldHistory | undefined;
}

export function resolveWorldOperation(document: GraphicsDocument, entry: HistoryEntry, worlds: Map<string, Graphics3DWorld>, worldHistories: WorldHistoryStore, reverse = false): GraphicsDocument {
  const operation = entry.operation;
  if (operation.type !== "world-operation") return applyOperation(document, operation, reverse);

  const world = worlds.get(operation.worldId);
  if (!world) throw new Error(`3D world not found: ${operation.worldId}`);
  const history = worldHistories.get(operation.worldId);
  if (!history) throw new Error(`3D world history not found: ${operation.worldId}`);
  const worldEntry = history.entries.find(item => item.id === operation.operationId);
  if (!worldEntry) throw new Error(`3D world operation not found: ${operation.operationId}`);

  const updatedWorld = applyWorldOperation(world, worldEntry.operation, reverse);
  worlds.set(operation.worldId, updatedWorld);
  return { ...document, worlds3d: (document.worlds3d ?? []).map(item => item.id === operation.worldId ? updatedWorld : item) };
}

export function resolveHistoryEntry(document: GraphicsDocument, entry: HistoryEntry, worlds: Map<string, Graphics3DWorld>, worldHistories: WorldHistoryStore, reverse = false): GraphicsDocument {
  return resolveWorldOperation(document, entry, worlds, worldHistories, reverse);
}

export function createWorldHistoryStore(histories: WorldHistory[]): WorldHistoryStore {
  const byId = new Map(histories.map(history => [history.worldId, history]));
  return { get: worldId => byId.get(worldId) };
}
