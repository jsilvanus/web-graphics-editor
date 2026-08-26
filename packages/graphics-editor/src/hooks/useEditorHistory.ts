import { useCallback, useRef, useState } from "react";
import type { GraphicsDocument } from "../types";

export function useEditorHistory(initial: GraphicsDocument) {
  const [document, setDocumentState] = useState(initial);
  const pastRef = useRef<GraphicsDocument[]>([]);
  const futureRef = useRef<GraphicsDocument[]>([]);

  const setDocument = useCallback((next: GraphicsDocument | ((current: GraphicsDocument) => GraphicsDocument), history = true) => {
    setDocumentState(current => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (history && resolved !== current) {
        pastRef.current = [...pastRef.current.slice(-99), current];
        futureRef.current = [];
      }
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    setDocumentState(current => {
      futureRef.current = [...futureRef.current, current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    setDocumentState(current => {
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  const resetHistory = useCallback((next: GraphicsDocument) => {
    pastRef.current = [];
    futureRef.current = [];
    setDocumentState(next);
  }, []);

  return {
    document,
    setDocument,
    undo,
    redo,
    resetHistory,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
