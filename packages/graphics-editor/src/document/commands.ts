import type { GraphicsDocument, Layer } from "../types";
import { alignLayers, distributeLayers, type AlignMode, type AlignReference, type DistributeMode } from "../alignment";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack, groupLayers, ungroupLayer, updateLayer, updateLayerStyle } from "./operations";
import { diffOperations, type DocumentOperation } from "../history/operations";

export interface CommandResult { document: GraphicsDocument; operation?: DocumentOperation }

function batchOrSingle(operations: DocumentOperation[]): DocumentOperation | undefined {
  return operations.length === 1 ? operations[0] : operations.length ? { type: "batch", operations } : undefined;
}

export function updateLayerCommand(document: GraphicsDocument, id: string, patch: Partial<Layer>): CommandResult {
  let next = document;
  const operations: DocumentOperation[] = [];
  for (const [property, to] of Object.entries(patch)) {
    const from = document.layers.find(layer => layer.id === id)?.[property as keyof Layer];
    if (Object.is(from, to)) continue;
    next = updateLayer(next, id, { [property]: to } as Partial<Layer>);
    operations.push({ type: "set-layer-property", layerId: id, property, from, to });
  }
  return { document: next, operation: batchOrSingle(operations) };
}

export function updateLayerStyleCommand(document: GraphicsDocument, id: string, key: string, value: string | number | undefined): CommandResult {
  const layer = document.layers.find(item => item.id === id);
  if (!layer) return { document };
  const from = layer.style?.[key];
  if (Object.is(from, value)) return { document };
  if (value === undefined) {
    const style = { ...(layer.style ?? {}) }; delete style[key];
    return { document: updateLayer(document, id, { style }), operation: { type: "set-layer-style", layerId: id, property: key, from, to: value } };
  }
  return { document: updateLayerStyle(document, id, key, value), operation: { type: "set-layer-style", layerId: id, property: key, from, to: value } };
}

export function reorderLayerCommand(document: GraphicsDocument, id: string, action: "forward" | "backward" | "front" | "back"): CommandResult {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0) return { document };
  const targetIndex = action === "forward" ? Math.min(index + 1, document.layers.length - 1) : action === "backward" ? Math.max(index - 1, 0) : action === "front" ? document.layers.length - 1 : 0;
  if (targetIndex === index) return { document };
  const next = action === "forward" ? bringLayerForward(document, id) : action === "backward" ? sendLayerBackward(document, id) : action === "front" ? bringLayerToFront(document, id) : sendLayerToBack(document, id);
  return { document: next, operation: { type: "reorder-layer", layerId: id, fromIndex: index, toIndex: targetIndex } };
}

export function groupLayersCommand(document: GraphicsDocument, ids: Set<string>): CommandResult {
  const result = groupLayers(document, ids);
  if (!result.groupId) return { document };
  const children = document.layers.filter(layer => ids.has(layer.id) && layer.type !== "group");
  const index = document.layers.findIndex(layer => layer.id === children[0]?.id);
  const group = result.document.layers.find(layer => layer.id === result.groupId)!;
  return { document: result.document, operation: { type: "group-layers", group, children, index: Math.max(0, index) } };
}

export function ungroupLayerCommand(document: GraphicsDocument, id: string): CommandResult {
  const group = document.layers.find(layer => layer.id === id && layer.type === "group");
  if (!group?.children?.length) return { document };
  const children = document.layers.filter(layer => group.children!.includes(layer.id));
  const index = document.layers.findIndex(layer => layer.id === id);
  return { document: ungroupLayer(document, id), operation: { type: "ungroup-layer", group: { ...group }, children, index } };
}

export function removeLayerCommand(document: GraphicsDocument, id: string): CommandResult {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0) return { document };
  return { document: { ...document, layers: document.layers.filter(layer => layer.id !== id) }, operation: { type: "remove-layer", layer: document.layers[index], index } };
}

export function addLayerCommand(document: GraphicsDocument, layer: Layer, index?: number): CommandResult {
  const target = Math.max(0, Math.min(index ?? document.layers.length, document.layers.length));
  const layers = [...document.layers];
  layers.splice(target, 0, layer);
  return { document: { ...document, layers }, operation: { type: "add-layer", layer, index: target } };
}

export function alignLayersCommand(document: GraphicsDocument, ids: Set<string>, mode: AlignMode, reference: AlignReference): CommandResult {
  const layers = alignLayers(document.layers, ids, mode, reference, document.width, document.height);
  const next = layers === document.layers ? document : { ...document, layers };
  return { document: next, operation: batchOrSingle(diffOperations(document, next)) };
}

export function distributeLayersCommand(document: GraphicsDocument, ids: Set<string>, mode: DistributeMode): CommandResult {
  const layers = distributeLayers(document.layers, ids, mode);
  const next = layers === document.layers ? document : { ...document, layers };
  return { document: next, operation: batchOrSingle(diffOperations(document, next)) };
}
