import type { GraphicsDocument, Layer } from "../types";

/**
 * Pure, renderer-independent document commands.
 *
 * These functions are the semantic mutation boundary for the editor. They do
 * not know about React, history, persistence or rendering; callers decide how
 * the returned document is committed and recorded.
 */

export function updateLayer(document: GraphicsDocument, id: string, patch: Partial<Layer>): GraphicsDocument {
  return {
    ...document,
    layers: document.layers.map(layer => layer.id === id ? { ...layer, ...patch } : layer),
  };
}

export function updateLayerStyle(document: GraphicsDocument, id: string, key: string, value: string | number): GraphicsDocument {
  const layer = document.layers.find(item => item.id === id);
  if (!layer) return document;
  return updateLayer(document, id, { style: { ...layer.style, [key]: value } });
}

function moveLayer(document: GraphicsDocument, id: string, targetIndex: number): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0 || index === targetIndex || targetIndex < 0 || targetIndex >= document.layers.length) return document;
  const layers = [...document.layers];
  const [layer] = layers.splice(index, 1);
  layers.splice(targetIndex, 0, layer);
  return { ...document, layers };
}

export function bringLayerForward(document: GraphicsDocument, id: string): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  return index < 0 ? document : moveLayer(document, id, index + 1);
}

export function sendLayerBackward(document: GraphicsDocument, id: string): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  return index < 0 ? document : moveLayer(document, id, index - 1);
}

export function bringLayerToFront(document: GraphicsDocument, id: string): GraphicsDocument {
  return moveLayer(document, id, document.layers.length - 1);
}

export function sendLayerToBack(document: GraphicsDocument, id: string): GraphicsDocument {
  return moveLayer(document, id, 0);
}

export function groupLayers(document: GraphicsDocument, ids: Set<string>): { document: GraphicsDocument; groupId: string } {
  const selected = document.layers.filter(layer => ids.has(layer.id) && layer.type !== "group");
  if (selected.length < 2) return { document, groupId: "" };

  const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const minX = Math.min(...selected.map(l => l.x));
  const minY = Math.min(...selected.map(l => l.y));
  const maxX = Math.max(...selected.map(l => l.x + l.width));
  const maxY = Math.max(...selected.map(l => l.y + l.height));
  const group: Layer = {
    id: groupId,
    type: "group",
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    children: selected.map(l => l.id),
  };
  const set = new Set(selected.map(l => l.id));
  const first = document.layers.findIndex(l => set.has(l.id));
  const remaining = document.layers.filter(l => !set.has(l.id));
  remaining.splice(first, 0, group);

  return {
    groupId,
    document: {
      ...document,
      layers: [...remaining, ...selected.map(l => ({ ...l, parentId: groupId }))],
    },
  };
}

export function ungroupLayer(document: GraphicsDocument, id: string): GraphicsDocument {
  const group = document.layers.find(l => l.id === id && l.type === "group");
  if (!group?.children?.length) return document;
  const set = new Set(group.children);
  const children = document.layers.filter(l => set.has(l.id)).map(l => ({ ...l, parentId: undefined }));
  const others = document.layers.filter(l => l.id !== id && !set.has(l.id));
  const index = document.layers.findIndex(l => l.id === id);
  others.splice(Math.min(index, others.length), 0, ...children);
  return { ...document, layers: others };
}

export function getLayerTreeIds(document: GraphicsDocument, id: string): Set<string> {
  const result = new Set<string>();
  const visit = (layerId: string) => {
    if (result.has(layerId)) return;
    result.add(layerId);
    const layer = document.layers.find(l => l.id === layerId);
    if (layer?.type === "group") layer.children?.forEach(visit);
  };
  visit(id);
  return result;
}

export function moveLayersByDelta(document: GraphicsDocument, ids: Set<string>, dx: number, dy: number): GraphicsDocument {
  if (!ids.size || (dx === 0 && dy === 0)) return document;
  return {
    ...document,
    layers: document.layers.map(layer => ids.has(layer.id)
      ? { ...layer, x: Math.round(layer.x + dx), y: Math.round(layer.y + dy) }
      : layer),
  };
}

export function documentsEqual(a: GraphicsDocument, b: GraphicsDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
