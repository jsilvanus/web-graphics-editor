import type { GraphicsDocument } from "../types";
import type { Actor, DocumentOperation, HistoryEntry } from "./operations";

export interface HistoryCheckpoint {
  id: string;
  timestamp: number;
  operationIndex: number;
  document: GraphicsDocument;
}

export interface DocumentHistory {
  entries: HistoryEntry[];
  checkpoints: HistoryCheckpoint[];
}

export const DEFAULT_CHECKPOINT_INTERVAL = 50;

export function createHistory(document: GraphicsDocument): DocumentHistory {
  return {
    entries: [],
    checkpoints: [{ id: "checkpoint-0", timestamp: Date.now(), operationIndex: 0, document }],
  };
}

export function appendHistory(
  history: DocumentHistory,
  document: GraphicsDocument,
  operation: DocumentOperation,
  actor: string,
  label: string,
  checkpointInterval = DEFAULT_CHECKPOINT_INTERVAL,
): DocumentHistory {
  const entry: HistoryEntry = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    label,
    actor,
    operation,
  };
  const entries = [...history.entries, entry];
  const shouldCheckpoint = entries.length % checkpointInterval === 0;
  const checkpoints = shouldCheckpoint
    ? [...history.checkpoints, {
        id: `checkpoint-${entries.length}`,
        timestamp: Date.now(),
        operationIndex: entries.length,
        document,
      }]
    : history.checkpoints;
  return { entries, checkpoints };
}

export function defaultActor(vocabularyId = "ui"): Actor {
  return { type: "human", source: vocabularyId };
}
