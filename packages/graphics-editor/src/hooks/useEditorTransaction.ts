import { useCallback, useRef } from "react";
import type { GraphicsDocument } from "../types";

/** Coalesces many transient pointer updates into one history commit. */
export function useEditorTransaction(document: GraphicsDocument, commit: (document: GraphicsDocument) => void) {
  const startRef = useRef<GraphicsDocument | null>(null);

  const begin = useCallback(() => {
    startRef.current = document;
  }, [document]);

  const update = useCallback((next: GraphicsDocument) => {
    commit(next);
  }, [commit]);

  const end = useCallback((current: GraphicsDocument) => {
    const start = startRef.current;
    startRef.current = null;
    if (start && start !== current) commit(current);
  }, [commit]);

  return { begin, update, end };
}
