import type { GraphicsDocument, Layer, LayerType } from "../types";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack, groupLayers, ungroupLayer, updateLayer, updateLayerStyle } from "./operations";
import type { DocumentOperation } from "../history/operations";

export interface CommandResult {
  document: GraphicsDocument;
  operation?: DocumentOperation;
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
  return { document: next, operation: operations.length === 1 ? operations[0] : operations.length ? { type: "batch", operations } : undefined } as CommandResult;
}

export function updateLayerStyleCommand(document: GraphicsDocument, id: string, key: string, value: string | number | undefined): CommandResult {
  const from = document.layers.find(layer => layer.id === id)?.style?.[key];
  if (Object.is(from, value)) return { document };
  const next = value === undefined ? updateLayer(document, id, { style: { ...document.layers.find(layer => layer.id === id)?.style, [key]: undefined } }) : updateLayerStyle(document, id, key, value);
  return { document: next, operation: { type: "set-layer-style", layerId: id, property: key, from, to: value } };
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
  return { document: result.document, operation: { type: "group-layers", groupId: result.groupId, layerIds: [...ids].filter(id => id !== result.groupId) } };
}

export function ungroupLayerCommand(document: GraphicsDocument, id: string): CommandResult {
  const group = document.layers.find(layer => layer.id === id && layer.type === "group");
  if (!group?.children?.length) return { document };
  return { document: ungroupLayer(document, id), operation: { type: "ungroup-layer", group: { ...group } } };
}

export function removeLayerCommand(document: GraphicsDocument, id: string): CommandResult {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0) return { document };
  return { document: { ...document, layers: document.layers.filter(layer => layer.id !== id) }, operation: { type: "remove-layer", layer: document.layers[index], index } };
}

export function addLayerCommand(document: GraphicsDocument, layer: Layer, index?: number): CommandResult {
  const target = index ?? document.layers.length;
  const layers = [...document.layers];
  layers.splice(Math.max(0, Math.min(target, layers.length)), 0, layer);
  return { document: { ...document, layers }, operation: { type: "add-layer", layer, index: target } };
}

export type { LayerType };
