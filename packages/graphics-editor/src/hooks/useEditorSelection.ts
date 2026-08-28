import { useCallback, useState } from "react";
import { setReferenceSelection } from "../referenceStore";

export function useEditorSelection(initialId: string | null = null) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialId ? new Set([initialId]) : new Set());
  const [primaryId, setPrimaryId] = useState<string | null>(initialId);
  if (initialId) setReferenceSelection(initialId);

  const select = useCallback((id: string, additive = false) => {
    setSelectedIds(current => {
      const next = additive ? new Set(current) : new Set<string>();
      if (additive && next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setPrimaryId(id);
    setReferenceSelection(id);
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setPrimaryId(null);
    setReferenceSelection(null);
  }, []);

  const selectOnly = useCallback((id: string | null) => {
    if (id === null) return clear();
    setSelectedIds(new Set([id]));
    setPrimaryId(id);
    setReferenceSelection(id);
  }, [clear]);

  return { selectedIds, primaryId, select, selectOnly, clear };
}
