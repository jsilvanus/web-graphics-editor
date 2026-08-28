import type { GraphicsDocument } from "../types";
import type { DocumentOperation, HistoryEntry } from "./operations";

export interface HistoryCheckpoint { id:string; timestamp:number; document:GraphicsDocument; operationIndex:number; }
export interface HistoryState { checkpoints:HistoryCheckpoint[]; operations:HistoryEntry[]; }

export const createHistoryState = (document:GraphicsDocument):HistoryState => ({checkpoints:[{id:crypto.randomUUID(),timestamp:Date.now(),document,operationIndex:0}],operations:[]});

export function recordOperation(state:HistoryState, operation:DocumentOperation, label=operation.type, checkpointEvery=50):HistoryState {
  const entry:HistoryEntry={id:crypto.randomUUID(),timestamp:Date.now(),label,operation};
  const operations=[...state.operations,entry];
  const checkpoints=operations.length%checkpointEvery===0?[...state.checkpoints,{id:crypto.randomUUID(),timestamp:Date.now(),document:state.checkpoints.length?state.checkpoints[state.checkpoints.length-1].document:undefined as never,operationIndex:operations.length}]:state.checkpoints;
  return {checkpoints,operations};
}
