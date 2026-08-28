import { useCallback, useRef, useState } from "react";
import type { GraphicsDocument } from "../types";
import { appendHistory, createHistory, type DocumentHistory } from "../history/store";
import type { Actor, DocumentOperation } from "../history/operations";
import { applyOperation } from "../history/operations";

export interface EditorOperationOptions {
  actorId?: string;
  actor?: Actor;
  label?: string;
}

export function useEditorHistory(initialDocument: GraphicsDocument) {
  const [document, setCurrentDocument] = useState(initialDocument);
  const documentRef = useRef(initialDocument);
  const pastRef = useRef<GraphicsDocument[]>([]);
  const futureRef = useRef<GraphicsDocument[]>([]);
  const historyRef = useRef<DocumentHistory>(createHistory(initialDocument));
  const [, forceUpdate] = useState(0);

  const apply = useCallback((next: GraphicsDocument) => {
    documentRef.current = next;
    setCurrentDocument(next);
  }, []);

  const setDocument = useCallback((next: GraphicsDocument | ((current: GraphicsDocument) => GraphicsDocument), history = true) => {
    const current = documentRef.current;
    const resolved = typeof next === "function" ? next(current) : next;
    if (resolved === current) return;
    if (history) {
      pastRef.current = [...pastRef.current.slice(-99), current];
      futureRef.current = [];
    }
    apply(resolved);
    forceUpdate(value => value + 1);
  }, [apply]);

  const execute = useCallback((operation: DocumentOperation, options: EditorOperationOptions = {}) => {
    const current = documentRef.current;
    const next = applyOperation(current, operation);
    if (next === current) return;
    pastRef.current = [...pastRef.current.slice(-99), current];
    futureRef.current = [];
    historyRef.current = appendHistory(
      historyRef.current,
      next,
      operation,
      options.actorId ?? "unknown",
      options.label ?? operation.type,
    );
    apply(next);
    forceUpdate(value => value + 1);
  }, [apply]);

  const recordOperation = useCallback((operation: DocumentOperation, options: EditorOperationOptions = {}) => {
    const next = applyOperation(documentRef.current, operation);
    if (next === documentRef.current) return;
    pastRef.current = [...pastRef.current.slice(-99), documentRef.current];
    futureRef.current = [];
    historyRef.current = appendHistory(historyRef.current, next, operation, options.actorId ?? "unknown", options.label ?? operation.type);
    apply(next);
    forceUpdate(value => value + 1);
  }, [apply]);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(documentRef.current);
    apply(previous);
    forceUpdate(value => value + 1);
  }, [apply]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(documentRef.current);
    apply(next);
    forceUpdate(value => value + 1);
  }, [apply]);

  const resetHistory = useCallback((next: GraphicsDocument) => {
    pastRef.current = [];
    futureRef.current = [];
    historyRef.current = createHistory(next);
    apply(next);
    forceUpdate(value => value + 1);
  }, [apply]);

  return {
    document,
    setDocument,
    execute,
    recordOperation,
    history: historyRef.current,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    resetHistory,
  };
}
