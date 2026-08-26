import type { CSSProperties } from "react";
import { GRID } from "./constants";
import type { Layer } from "./types";

export function anchor(handle: string, layer: Layer) {
  const { width, height } = layer;
  return { left: handle.includes("e") ? width : handle.includes("w") ? 0 : width / 2, top: handle.includes("s") ? height : handle.includes("n") ? 0 : height / 2 };
}

export function resizeLayer(handle: string, start: Layer, dx: number, dy: number) {
  let { x, y, width, height } = start;
  if (handle.includes("e")) width += dx;
  if (handle.includes("w")) { x += dx; width -= dx; }
  if (handle.includes("s")) height += dy;
  if (handle.includes("n")) { y += dy; height -= dy; }
  return { x: Math.round(x), y: Math.round(y), width: Math.max(20, Math.round(width)), height: Math.max(20, Math.round(height)) };
}

export function snap(value: number) { return Math.round(value / GRID) * GRID; }

export function layerStyle(layer: Layer, selected: boolean): CSSProperties {
  const css: CSSProperties = {};
  for (const [key, value] of Object.entries(layer.style ?? {})) {
    (css as Record<string, unknown>)[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return { position: "absolute", left: layer.x, top: layer.y, width: layer.width, height: layer.height, boxSizing: "border-box", userSelect: "none", cursor: "move", outline: selected ? "3px solid #38bdf8" : undefined, animation: layer.animation || undefined, transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined, ...css };
}

export function parsePx(value: unknown, fallback = 0) { const n = Number.parseFloat(String(value ?? "")); return Number.isFinite(n) ? n : fallback; }
export function styleValue(layer: Layer, key: string, fallback = "") { return String(layer.style?.[key] ?? fallback); }
