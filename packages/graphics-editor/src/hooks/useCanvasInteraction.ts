import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { HEIGHT, WIDTH } from "../constants";
import { resizeLayer, snap } from "../geometry";
import type { GraphicsDocument, Layer } from "../types";

export type CanvasDrag = { kind: string; layerId: string; handle?: string; startX: number; startY: number; layer: Layer; scale: number; left: number; top: number };

export function useCanvasInteraction(document: GraphicsDocument, artboardRef: RefObject<HTMLDivElement | null>, grid: boolean, aspectLock: boolean, onChange: (next: GraphicsDocument) => void) {
  const dragRef = useRef<CanvasDrag | null>(null);
  const pointerDown = useCallback((event: ReactPointerEvent, id: string, kind: string, handle?: string) => {
    event.stopPropagation();
    const layer = document.layers.find(item => item.id === id);
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!layer || !rect?.width) return;
    dragRef.current = { kind, layerId: id, handle, startX: event.clientX, startY: event.clientY, layer: { ...layer }, scale: rect.width / (document.width || WIDTH), left: rect.left, top: rect.top };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }, [artboardRef, document]);

  const pointerMove = useCallback((event: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.scale;
    const dy = (event.clientY - drag.startY) / drag.scale;
    let patch: Partial<Layer>;
    if (drag.kind === "move") {
      let x = drag.layer.x + dx, y = drag.layer.y + dy;
      if (grid) { x = snap(x); y = snap(y); }
      patch = { x: Math.round(x), y: Math.round(y) };
    } else if (drag.kind === "resize") {
      const result = resizeLayer(drag.handle ?? "se", drag.layer, dx, dy);
      if (aspectLock) {
        const ratio = drag.layer.width / drag.layer.height;
        if (["e", "w"].includes(drag.handle ?? "")) result.height = Math.max(20, Math.round(result.width / ratio));
        else if (["n", "s"].includes(drag.handle ?? "")) result.width = Math.max(20, Math.round(result.height * ratio));
      }
      patch = result;
    } else {
      const cx = drag.layer.x + drag.layer.width / 2;
      const cy = drag.layer.y + drag.layer.height / 2;
      const px = (event.clientX - drag.left) / drag.scale;
      const py = (event.clientY - drag.top) / drag.scale;
      let angle = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90;
      if (grid) angle = Math.round(angle / 15) * 15;
      patch = { rotation: Math.round(angle) };
    }
    onChange({ ...document, layers: document.layers.map(layer => layer.id === drag.layerId ? { ...layer, ...patch } : layer) });
  }, [document, grid, aspectLock, onChange]);

  const pointerUp = useCallback(() => { dragRef.current = null; }, []);
  return { pointerDown, pointerMove, pointerUp };
}
