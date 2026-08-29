import type { Layer } from "./types";

export function getChildLayers(layers: Layer[], parentId: string): Layer[] {
  const parent = layers.find(layer => layer.id === parentId);
  if (!parent?.children?.length) return [];
  const byId = new Map(layers.map(layer => [layer.id, layer]));
  return parent.children.map(id => byId.get(id)).filter((layer): layer is Layer => !!layer);
}

export function getRootLayers(layers: Layer[]): Layer[] {
  return layers.filter(layer => !layer.parentId);
}

export function getDescendantIds(layers: Layer[], parentId: string): Set<string> {
  const result = new Set<string>();
  const visit = (id: string) => {
    if (result.has(id)) return;
    result.add(id);
    getChildLayers(layers, id).forEach(child => visit(child.id));
  };
  visit(parentId);
  return result;
}
