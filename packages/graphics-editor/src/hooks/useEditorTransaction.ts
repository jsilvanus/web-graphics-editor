import { useCallback, useRef } from "react";
import type { GraphicsDocument } from "../types";

/** Sends live pointer updates without recording each update, then commits once on pointer-up. */
export function useEditorTransaction(document: GraphicsDocument, transientChange: (document: GraphicsDocument) => void, commit: (document: GraphicsDocument) => void) {
  const startRef = useRef<GraphicsDocument | null>(null);

  const begin = useCallback(() => {
    startRef.current = document;
  }, [document]);

  const update = useCallback((next: GraphicsDocument) => {
    transientChange(next);
  }, [transientChange]);

  const end = useCallback((current: GraphicsDocument) => {
    const start = startRef.current;
    startRef.current = null;
    if (start && start !== current) commit(current);
  }, [commit]);

  const cancel = useCallback(() => { startRef.current = null; }, []);

  return { begin, update, end, cancel };
}
