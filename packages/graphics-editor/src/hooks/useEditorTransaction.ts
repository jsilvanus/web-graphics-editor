import { useCallback, useRef } from "react";
import type { GraphicsDocument } from "../types";

/** Coalesces transient pointer edits into one history commit. */
export function useEditorTransaction(commit: (document: GraphicsDocument) => void) {
  const startRef = useRef<GraphicsDocument | null>(null);

  const begin = useCallback((document: GraphicsDocument) => {
    startRef.current = document;
  }, []);

  const end = useCallback((current: GraphicsDocument) => {
    const start = startRef.current;
    startRef.current = null;
    if (start && start !== current) commit(current);
  }, [commit]);

  const cancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { begin, end, cancel };
}
