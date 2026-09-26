import { useCallback } from "react";
import {
  alignLayersCommand,
  distributeLayersCommand,
  booleanLayersCommand,
  joinPathLayersCommand,
  offsetPathCommand,
  flattenPathCommand,
  convertLayerToPathCommand,
  convertPathToShapeCommand,
} from "../document/commands";
import type { GraphicsDocument } from "../types";
import type { EditorOperationOptions } from "./useEditorHistory";
import { useLayerOperations } from "./useLayerOperations";
import type { AlignMode, AlignReference, DistributeMode } from "../alignment";

export function useLayerCommands(
  document: GraphicsDocument,
  executeCommand: (
    command: { document: GraphicsDocument; operation?: import("../history/operations").DocumentOperation },
    options?: EditorOperationOptions,
  ) => GraphicsDocument | undefined,
  selectedIds: Set<string>,
  primaryId: string | null,
  select: (id: string) => void,
  clear: () => void,
) {
  const {
    add,
    remove,
    duplicate,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    group,
    ungroup,
    move,
  } = useLayerOperations(executeCommand, document);

  const addLayer = useCallback(
    (type: Parameters<typeof add>[0]) => {
      const id = add(type);
      if (id) select(id);
    },
    [add, select],
  );

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

  const applyAlign = useCallback(
    (mode: AlignMode, reference: AlignReference) => {
      if (selectedIds.size < 1) return;
      executeCommand(alignLayersCommand(document, selectedIds, mode, reference), { label: `Align ${mode}` });
    },
    [selectedIds, document, executeCommand],
  );

  const convertToPath = useCallback(
    (id: string) =>
      executeCommand(convertLayerToPathCommand(document, id), { label: "Convert shape to path" }),
    [document, executeCommand],
  );
  const convertToShape = useCallback(
    (id: string) =>
      executeCommand(convertPathToShapeCommand(document, id), { label: "Convert path to shape" }),
    [document, executeCommand],
  );

  const flattenPath = useCallback(
    (id: string) => executeCommand(flattenPathCommand(document, id), { label: "Flatten path" }),
    [document, executeCommand],
  );

  const applyOffset = useCallback(
    (distance: number) => {
      if (!primaryId) return;
      executeCommand(offsetPathCommand(document, primaryId, distance), { label: `Offset path ${distance}` });
    },
    [primaryId, document, executeCommand],
  );

  const applyJoinPaths = useCallback(() => {
    if (selectedIds.size !== 2) return;
    const ids = [...selectedIds];
    executeCommand(joinPathLayersCommand(document, ids), { label: "Join paths" });
  }, [selectedIds, document, executeCommand]);

  const applyBoolean = useCallback(
    (operation: import("../geometry/boolean").BooleanOperation) => {
      if (selectedIds.size !== 2) return;
      executeCommand(booleanLayersCommand(document, [...selectedIds], operation), {
        label: `Boolean ${operation}`,
      });
    },
    [selectedIds, document, executeCommand],
  );

  const applyDistribute = useCallback(
    (mode: DistributeMode) => {
      if (selectedIds.size < 3) return;
      executeCommand(distributeLayersCommand(document, selectedIds, mode), { label: `Distribute ${mode}` });
    },
    [selectedIds, document, executeCommand],
  );

  const moveLayer = useCallback(
    (id: string, targetId: string, position: "inside" | "before" | "after") => move(id, targetId, position),
    [move],
  );

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
    applyBoolean,
    applyJoinPaths,
    applyOffset,
    flattenPath,
    convertToPath,
    convertToShape,
    applyDistribute,
    primaryId,
  };
}
