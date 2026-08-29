import { useCallback } from "react";
import type { GraphicsDocument, Layer, LayerType } from "../types";
import { updateLayerCommand, updateLayerStyleCommand, addLayerCommand, removeLayerCommand, reorderLayerCommand, groupLayersCommand, ungroupLayerCommand } from "../document/commands";
import type { DocumentOperation } from "../history/operations";
import type { EditorOperationOptions } from "./useEditorHistory";
import { linePath } from "../geometry/path";

type Command = { document: GraphicsDocument; operation?: DocumentOperation };
type ExecuteCommand = (command: Command, options?: EditorOperationOptions) => GraphicsDocument | undefined;

function createLayer(type: LayerType): Layer {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "text") return { id, type, x: 160, y: 300, width: 1600, height: 180, text: "Text", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } };
  if (type === "image") return { id, type, x: 460, y: 300, width: 1000, height: 500 };
  if (type === "line") return { id, type, x: 660, y: 500, width: 600, height: 0, style: { stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" }, path: linePath(0, 0, 600, 0) };
  if (type === "path") return { id, type, x: 660, y: 400, width: 600, height: 300, pathCommands: [{ type: "M", x: 0, y: 0 }, { type: "L", x: 300, y: 0 }, { type: "L", x: 600, y: 300 }], style: { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" } };
  if (type === "group") return { id, type, x: 0, y: 0, width: 0, height: 0, children: [] };
  return { id, type, x: 460, y: 300, width: 1000, height: type === "ellipse" ? 440 : 500, style: { background: type === "ellipse" ? "#fff" : "#111" } };
}

export function useLayerOperations(executeCommand: ExecuteCommand, document: GraphicsDocument) {
  const execute = useCallback((command: Command, label: string) => executeCommand(command, { label }), [executeCommand]);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => execute(updateLayerCommand(document, id, patch), "Update layer"), [document, execute]);
  const updateStyle = useCallback((id: string, key: string, value: string | number | undefined) => execute(updateLayerStyleCommand(document, id, key, value), `Set ${key}`), [document, execute]);

  const add = useCallback((type: LayerType) => {
    const layer = createLayer(type);
    execute(addLayerCommand(document, layer), `Add ${type}`);
    return layer.id;
  }, [document, execute]);

  const remove = useCallback((ids: Set<string>) => {
    const selected = document.layers.filter(layer => ids.has(layer.id));
    let next = document;
    const operations: DocumentOperation[] = [];
    for (const layer of [...selected].sort((a, b) => document.layers.findIndex(item => item.id === b.id) - document.layers.findIndex(item => item.id === a.id))) {
      const result = removeLayerCommand(next, layer.id);
      next = result.document;
      if (result.operation) operations.push(result.operation);
    }
    if (operations.length) execute({ document: next, operation: operations.length === 1 ? operations[0] : { type: "batch", operations } }, "Remove layers");
  }, [document, execute]);

  const duplicate = useCallback((ids: Set<string>) => {
    const selected = document.layers.filter(layer => ids.has(layer.id));
    const copies = selected.map(layer => ({ ...layer, id: `${layer.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: layer.x + 30, y: layer.y + 30, style: layer.style ? { ...layer.style } : undefined, pathCommands: layer.pathCommands?.map(command => ({ ...command })), nodes: layer.nodes?.map(node => ({ ...node, handleIn: node.handleIn && { ...node.handleIn }, handleOut: node.handleOut && { ...node.handleOut } })) }));
    let next = document;
    const operations: DocumentOperation[] = [];
    for (const layer of copies) { const result = addLayerCommand(next, layer); next = result.document; if (result.operation) operations.push(result.operation); }
    if (operations.length) execute({ document: next, operation: operations.length === 1 ? operations[0] : { type: "batch", operations } }, "Duplicate layers");
    return copies.map(layer => layer.id);
  }, [document, execute]);

  const reorder = useCallback((id: string, action: "forward" | "backward" | "front" | "back") => execute(reorderLayerCommand(document, id, action), action === "forward" ? "Bring layer forward" : action === "backward" ? "Send layer backward" : action === "front" ? "Bring layer to front" : "Send layer to back"), [document, execute]);
  const bringForward = useCallback((id: string) => reorder(id, "forward"), [reorder]);
  const sendBackward = useCallback((id: string) => reorder(id, "backward"), [reorder]);
  const bringToFront = useCallback((id: string) => reorder(id, "front"), [reorder]);
  const sendToBack = useCallback((id: string) => reorder(id, "back"), [reorder]);
  const group = useCallback((ids: Set<string>) => { const result = groupLayersCommand(document, ids); execute(result, "Group layers"); return result.operation?.type === "group-layers" ? result.operation.group.id : ""; }, [document, execute]);
  const ungroup = useCallback((id: string) => execute(ungroupLayerCommand(document, id), "Ungroup layer"), [document, execute]);

  return { updateLayer, updateStyle, add, remove, duplicate, bringForward, sendBackward, bringToFront, sendToBack, group, ungroup };
}
