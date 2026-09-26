import { useCallback, useRef } from "react";
import type { GraphicsDocument } from "../types";

/**
 * Coalesces transient pointer edits into one history entry. `begin` remembers the document before
 * the gesture; `end` records a single entry from it to whatever the document is by then.
 */
export function useEditorTransaction(
  getDocument: () => GraphicsDocument,
  commitFrom: (before: GraphicsDocument) => void,
) {
  const startRef = useRef<GraphicsDocument | null>(null);

  const begin = useCallback(() => {
    startRef.current = getDocument();
  }, [getDocument]);

  const end = useCallback(() => {
    const start = startRef.current;
    startRef.current = null;
    if (start) commitFrom(start);
  }, [commitFrom]);

  const cancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { begin, end, cancel };
}
