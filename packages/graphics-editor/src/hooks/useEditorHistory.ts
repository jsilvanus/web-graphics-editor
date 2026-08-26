import { useCallback, useRef, useState } from "react";
import type { GraphicsDocument } from "../types";

export function useEditorHistory(document: GraphicsDocument, onChange: (document: GraphicsDocument) => void) {
  const pastRef = useRef<GraphicsDocument[]>([]);
  const futureRef = useRef<GraphicsDocument[]>([]);
  const [, forceUpdate] = useState(0);

  const commit = useCallback((next: GraphicsDocument) => {
    if (next === document) return;
    pastRef.current = [...pastRef.current.slice(-99), document];
    futureRef.current = [];
    onChange(next);
    forceUpdate(value => value + 1);
  }, [document, onChange]);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(document);
    onChange(previous);
    forceUpdate(value => value + 1);
  }, [document, onChange]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(document);
    onChange(next);
    forceUpdate(value => value + 1);
  }, [document, onChange]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    forceUpdate(value => value + 1);
  }, []);

  return { commit, undo, redo, reset, canUndo: pastRef.current.length > 0, canRedo: futureRef.current.length > 0 };
}
