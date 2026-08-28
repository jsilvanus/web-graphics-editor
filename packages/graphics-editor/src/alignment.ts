import type { Layer } from "./types";

export type AlignMode = "left" | "center-x" | "right" | "top" | "center-y" | "bottom";
export type AlignReference = "canvas" | "selection";
export type DistributeMode = "horizontal" | "vertical";

const bounds = (layers: Layer[]) => ({
  left: Math.min(...layers.map(l => l.x)),
  top: Math.min(...layers.map(l => l.y)),
  right: Math.max(...layers.map(l => l.x + l.width)),
  bottom: Math.max(...layers.map(l => l.y + l.height)),
});

export function alignLayers(layers: Layer[], ids: Set<string>, mode: AlignMode, reference: AlignReference, canvasWidth: number, canvasHeight: number): Layer[] {
  const selected = layers.filter(l => ids.has(l.id));
  if (!selected.length) return layers;
  const b = reference === "canvas" ? { left: 0, top: 0, right: canvasWidth, bottom: canvasHeight } : bounds(selected);
  return layers.map(layer => {
    if (!ids.has(layer.id)) return layer;
    switch (mode) {
      case "left": return { ...layer, x: b.left };
      case "center-x": return { ...layer, x: b.left + (b.right - b.left - layer.width) / 2 };
      case "right": return { ...layer, x: b.right - layer.width };
      case "top": return { ...layer, y: b.top };
      case "center-y": return { ...layer, y: b.top + (b.bottom - b.top - layer.height) / 2 };
      case "bottom": return { ...layer, y: b.bottom - layer.height };
    }
  });
}

export function distributeLayers(layers: Layer[], ids: Set<string>, mode: DistributeMode): Layer[] {
  const selected = layers.filter(l => ids.has(l.id));
  if (selected.length < 3) return layers;
  const sorted = [...selected].sort((a,b) => mode === "horizontal" ? a.x-b.x : a.y-b.y);
  const first = sorted[0], last = sorted[sorted.length-1];
  const firstEdge = mode === "horizontal" ? first.x : first.y;
  const lastEdge = mode === "horizontal" ? last.x + last.width : last.y + last.height;
  const totalSize = sorted.reduce((sum,l) => sum + (mode === "horizontal" ? l.width : l.height), 0);
  const gap = (lastEdge - firstEdge - totalSize) / (sorted.length - 1);
  let cursor = firstEdge;
  const positions = new Map<string, number>();
  sorted.forEach((layer, i) => {
    positions.set(layer.id, cursor);
    cursor += (mode === "horizontal" ? layer.width : layer.height) + gap;
  });
  return layers.map(layer => {
    const pos = positions.get(layer.id);
    if (pos === undefined || layer.id === first.id || layer.id === last.id) return layer;
    return mode === "horizontal" ? { ...layer, x: pos } : { ...layer, y: pos };
  });
}
