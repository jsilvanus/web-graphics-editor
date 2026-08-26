import type { GraphicsDocument, Layer } from "./types";

export function updateLayer(document: GraphicsDocument, id: string, patch: Partial<Layer>): GraphicsDocument {
  return { ...document, layers: document.layers.map(layer => layer.id === id ? { ...layer, ...patch } : layer) };
}

export function updateLayerStyle(document: GraphicsDocument, id: string, key: string, value: string | number): GraphicsDocument {
  return updateLayer(document, id, { style: { ...document.layers.find(layer => layer.id === id)?.style, [key]: value } });
}

export function documentsEqual(a: GraphicsDocument, b: GraphicsDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
