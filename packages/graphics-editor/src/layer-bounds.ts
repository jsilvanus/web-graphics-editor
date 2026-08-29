import type { Layer } from "./types";

export interface LayerBounds { x: number; y: number; width: number; height: number }

type Point = [number, number];

function rotatedBounds(layer: Layer): LayerBounds {
  const angle = (layer.rotation ?? 0) * Math.PI / 180;
  if (!angle) return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
  const cx = layer.x + layer.width / 2, cy = layer.y + layer.height / 2;
  const corners: Point[] = [[layer.x, layer.y], [layer.x + layer.width, layer.y], [layer.x + layer.width, layer.y + layer.height], [layer.x, layer.y + layer.height]];
  const points = corners.map(([x, y]) => { const dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)] as Point; });
  const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(0, Math.max(...xs) - x), height: Math.max(0, Math.max(...ys) - y) };
}

export function getLayerBounds(layers: Layer[], layerId: string): LayerBounds | null {
  const root = layers.find(layer => layer.id === layerId);
  if (!root) return null;
  const children = layers.filter(layer => layer.parentId === root.id);
  if (!children.length) return rotatedBounds(root);

  const boxes = children.map(child => getLayerBounds(layers, child.id)).filter((box): box is LayerBounds => !!box);
  if (!boxes.length) return rotatedBounds(root);
  const x = Math.min(...boxes.map(box => box.x), root.x);
  const y = Math.min(...boxes.map(box => box.y), root.y);
  const right = Math.max(...boxes.map(box => box.x + box.width), root.x + root.width);
  const bottom = Math.max(...boxes.map(box => box.y + box.height), root.y + root.height);
  return { x, y, width: right - x, height: bottom - y };
}

export function layerFrame(layer: Layer, layers: Layer[]): Layer {
  if (layer.type !== "group") return layer;
  const bounds = getLayerBounds(layers, layer.id);
  if (!bounds) return layer;
  return { ...layer, ...bounds };
}
