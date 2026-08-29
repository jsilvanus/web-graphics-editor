import { useCallback, useRef, useState } from "react";
import type { GraphicsDocument } from "../types";
import { appendHistory, createHistory, type DocumentHistory } from "../history/store";
import { applyOperation, type Actor, type DocumentOperation } from "../history/operations";

export interface EditorOperationOptions { actorId?: string; actor?: Actor; label?: string }
export interface DocumentCommand { document: GraphicsDocument; operation?: DocumentOperation }

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

  const recordOperation = useCallback((operation: DocumentOperation, options: EditorOperationOptions = {}) => {
    const current = documentRef.current;
    const next = applyOperation(current, operation);
    if (next === current) return current;
    pastRef.current = [...pastRef.current.slice(-99), current];
    futureRef.current = [];
    historyRef.current = appendHistory(
      historyRef.current,
      next,
      operation,
      options.actorId ?? "ui",
      options.label ?? operation.type,
    );
    apply(next);
    forceUpdate(v => v + 1);
    return next;
  }, [apply]);

  /** Execute a semantic command produced by the document command layer. */
  const executeCommand = useCallback((command: DocumentCommand, options: EditorOperationOptions = {}) => {
    if (!command.operation || command.document === documentRef.current) return documentRef.current;
    pastRef.current = [...pastRef.current.slice(-99), documentRef.current];
    futureRef.current = [];
    historyRef.current = appendHistory(
      historyRef.current,
      command.document,
      command.operation,
      options.actorId ?? "ui",
      options.label ?? command.operation.type,
    );
    apply(command.document);
    forceUpdate(v => v + 1);
    return command.document;
  }, [apply]);

  /** Canonical operation entry point. Raw setDocument remains for initialization/external sync. */
  const execute = recordOperation;

  const setDocument = useCallback((next: GraphicsDocument | ((current: GraphicsDocument) => GraphicsDocument), history = true, options: EditorOperationOptions = {}) => {
    const current = documentRef.current;
    const resolved = typeof next === "function" ? next(current) : next;
    if (resolved === current) return;
    if (!history) {
      apply(resolved);
      forceUpdate(v => v + 1);
      return;
    }
    throw new Error("Use execute(command) for document mutations; setDocument(..., true) is reserved for legacy callers.");
  }, [apply]);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(documentRef.current);
    apply(previous);
    forceUpdate(v => v + 1);
  }, [apply]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(documentRef.current);
    apply(next);
    forceUpdate(v => v + 1);
  }, [apply]);

  const resetHistory = useCallback((next: GraphicsDocument) => {
    pastRef.current = [];
    futureRef.current = [];
    historyRef.current = createHistory(next);
    apply(next);
    forceUpdate(v => v + 1);
  }, [apply]);

  return {
    document,
    setDocument,
    execute,
    executeCommand,
    recordOperation,
    history: historyRef.current,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    resetHistory,
  };
}
