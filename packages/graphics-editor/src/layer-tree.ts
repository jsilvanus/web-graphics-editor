import type { Layer } from "./types";

export interface LayerBounds { x: number; y: number; width: number; height: number }

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

/** Axis-aligned document-space bounds of a subtree, including rotated leaf corners. */
export function getLayerTreeBounds(layers: Layer[], layerId: string): LayerBounds {
  const layer = layers.find(item => item.id === layerId);
  if (!layer) return { x: 0, y: 0, width: 0, height: 0 };
  const children = getChildLayers(layers, layerId);
  if (!children.length) return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
  const points = children.flatMap(child => getTreeCorners(layers, child.id));
  if (!points.length) return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const x = Math.min(...xs), y = Math.min(...ys), right = Math.max(...xs), bottom = Math.max(...ys);
  return { x, y, width: right - x, height: bottom - y };
}

function getTreeCorners(layers: Layer[], id: string): Array<{ x: number; y: number }> {
  const layer = layers.find(item => item.id === id);
  if (!layer) return [];
  const children = getChildLayers(layers, id);
  if (!children.length) return rotatedCorners(layer);
  return children.flatMap(child => getTreeCorners(layers, child.id));
}

function rotatedCorners(layer: Layer): Array<{ x: number; y: number }> {
  const cx = layer.x + layer.width / 2, cy = layer.y + layer.height / 2;
  const angle = (layer.rotation ?? 0) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return [[layer.x, layer.y], [layer.x + layer.width, layer.y], [layer.x + layer.width, layer.y + layer.height], [layer.x, layer.y + layer.height]].map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  });
}
