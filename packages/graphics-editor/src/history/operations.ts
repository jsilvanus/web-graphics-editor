import type { GraphicsDocument, Layer } from "../types";

export type ActorType = "human" | "ai" | "automation";
export interface Actor { type: ActorType; userId?: string; source?: string }
export interface ActorVocabularyEntry { type: ActorType; userId?: string; pseudonym: string }
export interface ActorVocabulary { actors: Record<string, ActorVocabularyEntry> }

export interface GroupChildSnapshot { layer: Layer; index: number }

export type DocumentOperation =
  | { type: "set-layer-property"; layerId: string; property: string; from: unknown; to: unknown }
  | { type: "set-layer-style"; layerId: string; property: string; from: unknown; to: unknown }
  | { type: "move-layer"; layerId: string; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: "resize-layer"; layerId: string; from: { x: number; y: number; width: number; height: number }; to: { x: number; y: number; width: number; height: number } }
  | { type: "rotate-layer"; layerId: string; from: number; to: number }
  | { type: "add-layer"; layer: Layer; index?: number }
  | { type: "remove-layer"; layer: Layer; index: number }
  | { type: "reorder-layer"; layerId: string; fromIndex: number; toIndex: number }
  | { type: "group-layers"; group: Layer; children: GroupChildSnapshot[]; index: number }
  | { type: "ungroup-layer"; group: Layer; children: GroupChildSnapshot[]; index: number }
  | { type: "batch"; operations: DocumentOperation[] };

export interface HistoryEntry { id: string; timestamp: number; label: string; actor: string; operation: DocumentOperation }

function moveAtIndex(document: GraphicsDocument, id: string, targetIndex: number): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0) return document;
  const layers = [...document.layers];
  const [layer] = layers.splice(index, 1);
  layers.splice(Math.max(0, Math.min(targetIndex, layers.length)), 0, layer);
  return { ...document, layers };
}

function restoreChildren(document: GraphicsDocument, snapshots: GroupChildSnapshot[]): GraphicsDocument {
  const ids = new Set(snapshots.map(snapshot => snapshot.layer.id));
  const layers = document.layers.filter(layer => !ids.has(layer.id));
  for (const snapshot of [...snapshots].sort((a, b) => a.index - b.index)) {
    layers.splice(Math.max(0, Math.min(snapshot.index, layers.length)), 0, snapshot.layer);
  }
  return { ...document, layers };
}

function groupedChildren(snapshots: GroupChildSnapshot[], groupId: string): Layer[] {
  return snapshots.map(snapshot => ({ ...snapshot.layer, parentId: groupId }));
}

export function applyOperation(document: GraphicsDocument, operation: DocumentOperation, reverse = false): GraphicsDocument {
  if (operation.type === "batch") {
    const operations = reverse ? [...operation.operations].reverse() : operation.operations;
    return operations.reduce((current, item) => applyOperation(current, item, reverse), document);
  }
  if (operation.type === "add-layer") {
    if (reverse) return { ...document, layers: document.layers.filter(layer => layer.id !== operation.layer.id) };
    const layers = [...document.layers];
    layers.splice(Math.max(0, Math.min(operation.index ?? layers.length, layers.length)), 0, operation.layer);
    return { ...document, layers };
  }
  if (operation.type === "remove-layer") {
    if (reverse) return applyOperation(document, { type: "add-layer", layer: operation.layer, index: operation.index });
    return { ...document, layers: document.layers.filter(layer => layer.id !== operation.layer.id) };
  }
  if (operation.type === "reorder-layer") return moveAtIndex(document, operation.layerId, reverse ? operation.fromIndex : operation.toIndex);
  if (operation.type === "group-layers") {
    if (reverse) {
      const withoutGroup = document.layers.filter(layer => layer.id !== operation.group.id);
      return restoreChildren({ ...document, layers: withoutGroup }, operation.children);
    }
    const childIds = new Set(operation.children.map(snapshot => snapshot.layer.id));
    const layers = document.layers.filter(layer => !childIds.has(layer.id) && layer.id !== operation.group.id);
    layers.splice(Math.max(0, Math.min(operation.index, layers.length)), 0, operation.group);
    return { ...document, layers: [...layers, ...groupedChildren(operation.children, operation.group.id)] };
  }
  if (operation.type === "ungroup-layer") {
    if (reverse) {
      const withoutChildren = document.layers.filter(layer => !operation.children.some(snapshot => snapshot.layer.id === layer.id) && layer.id !== operation.group.id);
      withoutChildren.splice(Math.max(0, Math.min(operation.index, withoutChildren.length)), 0, operation.group);
      return { ...document, layers: [...withoutChildren, ...groupedChildren(operation.children, operation.group.id)] };
    }
    const childIds = new Set(operation.children.map(snapshot => snapshot.layer.id));
    return { ...document, layers: document.layers.filter(layer => layer.id !== operation.group.id && !childIds.has(layer.id)).concat(operation.children.map(snapshot => ({ ...snapshot.layer, parentId: undefined }))) };
  }
  const value = reverse ? operation.from : operation.to;
  return {
    ...document,
    layers: document.layers.map(layer => {
      if (layer.id !== operation.layerId) return layer;
      if (operation.type === "set-layer-style") {
        const style = { ...(layer.style ?? {}) };
        if (value === undefined || value === "") delete style[operation.property]; else style[operation.property] = value as string | number;
        return { ...layer, style };
      }
      if (operation.type === "move-layer") return { ...layer, ...(value as { x: number; y: number }) };
      if (operation.type === "resize-layer") return { ...layer, ...(value as { x: number; y: number; width: number; height: number }) };
      if (operation.type === "rotate-layer") return { ...layer, rotation: value as number };
      if (operation.type === "set-layer-property") return { ...layer, [operation.property]: value };
      return layer;
    }),
  };
}

export function invertOperation(operation: DocumentOperation): DocumentOperation {
  if (operation.type === "batch") return { type: "batch", operations: [...operation.operations].reverse().map(invertOperation) };
  if (operation.type === "add-layer") return { type: "remove-layer", layer: operation.layer, index: operation.index ?? 0 };
  if (operation.type === "remove-layer") return { type: "add-layer", layer: operation.layer, index: operation.index };
  if (operation.type === "reorder-layer") return { ...operation, fromIndex: operation.toIndex, toIndex: operation.fromIndex };
  if (operation.type === "group-layers") return { type: "ungroup-layer", group: operation.group, children: operation.children, index: operation.index };
  if (operation.type === "ungroup-layer") return { type: "group-layers", group: operation.group, children: operation.children, index: operation.index };
  return { ...operation, from: operation.to, to: operation.from };
}

export function diffOperations(before: GraphicsDocument, after: GraphicsDocument): DocumentOperation[] {
  const ops: DocumentOperation[] = [];
  const beforeById = new Map(before.layers.map((layer, index) => [layer.id, { layer, index }]));
  const afterById = new Map(after.layers.map((layer, index) => [layer.id, { layer, index }]));
  for (const [id, { layer, index }] of beforeById) if (!afterById.has(id)) ops.push({ type: "remove-layer", layer, index });
  for (const [id, { layer, index }] of afterById) if (!beforeById.has(id)) ops.push({ type: "add-layer", layer, index });
  for (const [id, { layer: beforeLayer, index: beforeIndex }] of beforeById) {
    const afterEntry = afterById.get(id); if (!afterEntry) continue;
    const { layer: afterLayer, index: afterIndex } = afterEntry;
    if (beforeIndex !== afterIndex) ops.push({ type: "reorder-layer", layerId: id, fromIndex: beforeIndex, toIndex: afterIndex });
    if (beforeLayer.x !== afterLayer.x || beforeLayer.y !== afterLayer.y) ops.push({ type: "move-layer", layerId: id, from: { x: beforeLayer.x, y: beforeLayer.y }, to: { x: afterLayer.x, y: afterLayer.y } });
    if (beforeLayer.width !== afterLayer.width || beforeLayer.height !== afterLayer.height) ops.push({ type: "resize-layer", layerId: id, from: { x: beforeLayer.x, y: beforeLayer.y, width: beforeLayer.width, height: beforeLayer.height }, to: { x: afterLayer.x, y: afterLayer.y, width: afterLayer.width, height: afterLayer.height } });
    if ((beforeLayer.rotation ?? 0) !== (afterLayer.rotation ?? 0)) ops.push({ type: "rotate-layer", layerId: id, from: beforeLayer.rotation ?? 0, to: afterLayer.rotation ?? 0 });
    const keys = new Set([...Object.keys(beforeLayer.style ?? {}), ...Object.keys(afterLayer.style ?? {})]);
    for (const key of keys) { const from = beforeLayer.style?.[key], to = afterLayer.style?.[key]; if (!Object.is(from, to)) ops.push({ type: "set-layer-style", layerId: id, property: key, from, to }); }
    for (const key of Object.keys(afterLayer) as (keyof Layer)[]) { if (["id", "type", "x", "y", "width", "height", "rotation", "style"].includes(key as string)) continue; const from = beforeLayer[key], to = afterLayer[key]; if (!Object.is(from, to)) ops.push({ type: "set-layer-property", layerId: id, property: key as string, from, to }); }
  }
  return ops;
}
