import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
/** Size of the rulers along the left and top edges; the artboard area starts after them. */
export const RULER_LEFT = 28;
export const RULER_TOP = 22;
const FIT_MARGIN = 24;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Pan/zoom state for the 2D canvas. Pan is measured in screen pixels from the top-left of the
 * artboard area (inside the rulers); zoom scales document pixels to screen pixels.
 *
 * Zoom: mouse wheel (towards the cursor). Pan: middle-drag, or space + drag.
 */
export function useCanvasViewport(width: number, height: number) {
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });
  const hostRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const spaceRef = useRef(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === "Space") spaceRef.current = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /** Zoom keeping the document point under (clientX, clientY) fixed; zooms about the centre otherwise. */
  const setZoomAt = useCallback(
    (zoom: number | ((current: number) => number), clientX?: number, clientY?: number) => {
      setViewport(current => {
        const nextZoom = clamp(typeof zoom === "function" ? zoom(current.zoom) : zoom, MIN_ZOOM, MAX_ZOOM);
        const rect = hostRef.current?.getBoundingClientRect();
        if (!rect) return { ...current, zoom: nextZoom };
        const x = clientX === undefined ? (rect.width - RULER_LEFT) / 2 : clientX - rect.left - RULER_LEFT;
        const y = clientY === undefined ? (rect.height - RULER_TOP) / 2 : clientY - rect.top - RULER_TOP;
        const documentX = (x - current.panX) / current.zoom;
        const documentY = (y - current.panY) / current.zoom;
        return { zoom: nextZoom, panX: x - documentX * nextZoom, panY: y - documentY * nextZoom };
      });
    },
    [],
  );

  // React registers wheel listeners as passive, so preventDefault() would be ignored and the page
  // would scroll while zooming. Attach a native, non-passive listener instead.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoomAt(current => current * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [setZoomAt]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.button !== 1 && !(event.button === 0 && spaceRef.current)) return;
      event.preventDefault();
      event.stopPropagation();
      panRef.current = { x: viewport.panX, y: viewport.panY, startX: event.clientX, startY: event.clientY };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [viewport.panX, viewport.panY],
  );
  const onPointerMove = useCallback((event: ReactPointerEvent) => {
    const pan = panRef.current;
    if (pan)
      setViewport(current => ({
        ...current,
        panX: pan.x + event.clientX - pan.startX,
        panY: pan.y + event.clientY - pan.startY,
      }));
  }, []);
  const onPointerUp = useCallback(() => {
    panRef.current = null;
  }, []);

  const fit = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const availableWidth = host.clientWidth - RULER_LEFT;
    const availableHeight = host.clientHeight - RULER_TOP;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const zoom = clamp(
      Math.min((availableWidth - FIT_MARGIN * 2) / width, (availableHeight - FIT_MARGIN * 2) / height),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    setViewport({
      zoom,
      panX: (availableWidth - width * zoom) / 2,
      panY: (availableHeight - height * zoom) / 2,
    });
  }, [width, height]);

  // Fit the document once the viewport first has a size (and again if the document size changes).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let fitted = false;
    const observer = new ResizeObserver(() => {
      if (fitted || host.clientWidth === 0) return;
      fitted = true;
      fit();
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [fit]);

  return {
    viewport,
    hostRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    setZoom: (zoom: number) => setZoomAt(zoom),
    zoomIn: () => setZoomAt(current => current * 1.2),
    zoomOut: () => setZoomAt(current => current / 1.2),
    fit,
    reset: fit,
  };
}
