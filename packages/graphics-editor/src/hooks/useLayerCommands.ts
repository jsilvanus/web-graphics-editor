import { useCallback } from "react";
import { alignLayersCommand, distributeLayersCommand } from "../document/commands";
import type { GraphicsDocument } from "../types";
import type { EditorOperationOptions } from "./useEditorHistory";
import { useLayerOperations } from "./useLayerOperations";
import type { AlignMode, AlignReference, DistributeMode } from "../alignment";

export function useLayerCommands(
  document: GraphicsDocument,
  executeCommand: (command: { document: GraphicsDocument; operation?: import("../history/operations").DocumentOperation }, options?: EditorOperationOptions) => GraphicsDocument | undefined,
  selectedIds: Set<string>,
  primaryId: string | null,
  select: (id: string) => void,
  clear: () => void,
) {
  const { add, remove, duplicate, bringForward, sendBackward, bringToFront, sendToBack, group, ungroup } = useLayerOperations(executeCommand, document);

  const addLayer = useCallback((type: Parameters<typeof add>[0]) => {
    const id = add(type);
    if (id) select(id);
  }, [add, select]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    remove(selectedIds);
    clear();
  }, [selectedIds, remove, clear]);

  const duplicateSelected = useCallback(() => {
    if (!selectedIds.size) return;
    const ids = duplicate(selectedIds);
    if (ids.length) select(ids[0]);
  }, [selectedIds, duplicate, select]);

  const applyAlign = useCallback((mode: AlignMode, reference: AlignReference) => {
    if (selectedIds.size < 1) return;
    executeCommand(alignLayersCommand(document, selectedIds, mode, reference), { label: `Align ${mode}` });
  }, [selectedIds, document, executeCommand]);

  const applyDistribute = useCallback((mode: DistributeMode) => {
    if (selectedIds.size < 3) return;
    executeCommand(distributeLayersCommand(document, selectedIds, mode), { label: `Distribute ${mode}` });
  }, [selectedIds, document, executeCommand]);

  return {
    add,
    remove,
    duplicate,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    group,
    ungroup,
    addLayer,
    deleteSelected,
    duplicateSelected,
    applyAlign,
    applyDistribute,
    primaryId,
  };
}
