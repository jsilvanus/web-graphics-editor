import type { GraphicsDocument } from "../types";
import type { DocumentOperation, HistoryEntry } from "./operations";
import { applyOperation } from "./operations";

export interface HistoryCheckpoint { id: string; timestamp: number; operationIndex: number; document: GraphicsDocument }
export interface DocumentHistory { entries: HistoryEntry[]; checkpoints: HistoryCheckpoint[] }
export const DEFAULT_CHECKPOINT_INTERVAL = 50;

let operationSequence = 0;

/** Generate a process-local globally unique operation ID. */
export function createOperationId(prefix = "op"): string {
  operationSequence += 1;
  return `${prefix}-${Date.now()}-${operationSequence}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createHistory(document: GraphicsDocument): DocumentHistory {
  return { entries: [], checkpoints: [{ id: "checkpoint-0", timestamp: Date.now(), operationIndex: 0, document }] };
}

export function appendHistory(history: DocumentHistory, document: GraphicsDocument, operation: DocumentOperation, actor: string, label: string, checkpointInterval = DEFAULT_CHECKPOINT_INTERVAL): DocumentHistory {
  const entry: HistoryEntry = { id: createOperationId(), timestamp: Date.now(), label, actor, operation };
  const entries = [...history.entries, entry];
  const checkpoints = entries.length % checkpointInterval === 0
    ? [...history.checkpoints, { id: `checkpoint-${entries.length}`, timestamp: Date.now(), operationIndex: entries.length, document }]
    : history.checkpoints;
  return { entries, checkpoints };
}

/** Rebuild a historical document from the nearest checkpoint and subsequent operations. */
export function reconstructVersion(history: DocumentHistory, operationIndex: number): GraphicsDocument {
  const target = Math.max(0, Math.min(operationIndex, history.entries.length));
  const checkpoint = [...history.checkpoints].reverse().find(c => c.operationIndex <= target) ?? history.checkpoints[0];
  let document = checkpoint.document;
  for (let i = checkpoint.operationIndex; i < target; i++) document = applyOperation(document, history.entries[i].operation);
  return document;
}
