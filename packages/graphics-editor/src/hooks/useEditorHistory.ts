import { useCallback, useRef, useState } from "react";
import type { GraphicsDocument } from "../types";

export function useEditorHistory(initialDocument: GraphicsDocument) {
  const [document, setCurrentDocument] = useState(initialDocument);
  const documentRef = useRef(initialDocument);
  const pastRef = useRef<GraphicsDocument[]>([]);
  const futureRef = useRef<GraphicsDocument[]>([]);
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
    apply(next);
    forceUpdate(value => value + 1);
  }, [apply]);

  return {
    document,
    setDocument,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    resetHistory,
  };
}
