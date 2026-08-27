import type { GraphicsDocument, Layer } from "./types";

export function updateLayer(document: GraphicsDocument, id: string, patch: Partial<Layer>): GraphicsDocument {
  return { ...document, layers: document.layers.map(layer => layer.id === id ? { ...layer, ...patch } : layer) };
}

export function updateLayerStyle(document: GraphicsDocument, id: string, key: string, value: string | number): GraphicsDocument {
  return updateLayer(document, id, { style: { ...document.layers.find(layer => layer.id === id)?.style, [key]: value } });
}

function moveLayer(document: GraphicsDocument, id: string, targetIndex: number): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  if (index < 0 || index === targetIndex || targetIndex < 0 || targetIndex >= document.layers.length) return document;
  const layers = [...document.layers];
  const [layer] = layers.splice(index, 1);
  layers.splice(targetIndex, 0, layer);
  return { ...document, layers };
}

/** Move one layer one position toward the front (higher z-index). */
export function bringLayerForward(document: GraphicsDocument, id: string): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  return index < 0 ? document : moveLayer(document, id, index + 1);
}

/** Move one layer one position toward the back (lower z-index). */
export function sendLayerBackward(document: GraphicsDocument, id: string): GraphicsDocument {
  const index = document.layers.findIndex(layer => layer.id === id);
  return index < 0 ? document : moveLayer(document, id, index - 1);
}

/** Move a layer to the highest z-index. */
export function bringLayerToFront(document: GraphicsDocument, id: string): GraphicsDocument {
  return moveLayer(document, id, document.layers.length - 1);
}

/** Move a layer to the lowest z-index. */
export function sendLayerToBack(document: GraphicsDocument, id: string): GraphicsDocument {
  return moveLayer(document, id, 0);
}

export function documentsEqual(a: GraphicsDocument, b: GraphicsDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
