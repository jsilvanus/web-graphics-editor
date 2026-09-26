import { useCallback, useRef, useState } from "react";
import { orthogonalPoint, pathCommandsToD } from "../geometry";
import type { GraphicsDocument, Layer, PathCommand, PathNode } from "../types";
import type { DrawingPreview } from "../components/GraphicsEditorCanvas";

export type DrawingTool = "select" | "line" | "path" | "orthogonal" | "polygon" | "star" | "freehand";

export function useEditorDrawing(
  document: GraphicsDocument,
  commit: (next: GraphicsDocument) => void,
  select: (id: string) => void,
  clear: () => void,
) {
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [drawing, setDrawing] = useState<DrawingPreview | null>(null);
  const drawingRef = useRef<DrawingPreview | null>(null);
  const canvasPoint = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, artboardRef: React.RefObject<HTMLDivElement>) => {
      const r = artboardRef.current?.getBoundingClientRect();
      return r
        ? {
            x: ((e.clientX - r.left) * document.width) / r.width,
            y: ((e.clientY - r.top) * document.height) / r.height,
          }
        : null;
    },
    [document.width, document.height],
  );
  const finishDrawing = useCallback(() => {
    const current = drawingRef.current;
    // A double-click to finish also lands two clicks on the same spot; drop repeated points.
    const c = current && {
      ...current,
      points: current.points.filter(
        (p, i, all) => i === 0 || Math.hypot(p.x - all[i - 1].x, p.y - all[i - 1].y) > 0.5,
      ),
    };
    if (!c || c.points.length < 2) {
      drawingRef.current = null;
      setDrawing(null);
      return;
    }
    const xs = c.points.map(p => p.x),
      ys = c.points.map(p => p.y),
      minX = Math.min(...xs),
      minY = Math.min(...ys),
      maxX = Math.max(...xs),
      maxY = Math.max(...ys);
    const points = c.points.map(p => ({ x: p.x - minX, y: p.y - minY }));
    const finalPoints =
      c.tool === "star" && points.length >= 2
        ? (() => {
            const cx = points[0].x,
              cy = points[0].y,
              r = Math.hypot(points[1].x - cx, points[1].y - cy),
              inner = r * 0.45;
            return Array.from({ length: 10 }, (_, i) => {
              const a = -Math.PI / 2 + (i * Math.PI) / 5,
                rr = i % 2 ? r : inner;
              return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
            });
          })()
        : points;
    const nodes: PathNode[] = finalPoints.map(p => ({ x: p.x, y: p.y, kind: "corner" }));
    const pathCommands: PathCommand[] = nodes.map((p, i) =>
      i === 0 ? { type: "M", x: p.x, y: p.y } : { type: "L", x: p.x, y: p.y },
    );
    const id = `${c.tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const layer: Layer = {
      id,
      type: c.tool === "line" ? "line" : ("path" as "line" | "path"),
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      path: pathCommandsToD(pathCommands),
      pathCommands,
      ...(c.tool === "line" ? {} : { nodes, closed: false }),
      style: {
        fill: "none",
        stroke: "#fff",
        "stroke-width": 4,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
    };
    commit({ ...document, layers: [...document.layers, layer] });
    select(id);
    drawingRef.current = null;
    setDrawing(null);
    setActiveTool("select");
  }, [commit, document, select]);
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, artboardRef: React.RefObject<HTMLDivElement>) => {
      if (activeTool === "select") {
        clear();
        return;
      }
      const p = canvasPoint(e, artboardRef);
      if (!p) return;
      if (activeTool === "line" || activeTool === "star") {
        drawingRef.current = { tool: activeTool, points: [p] };
        setDrawing(drawingRef.current);
        return;
      }
      const c = drawingRef.current;
      if (!c) {
        drawingRef.current = { tool: activeTool, points: [p] };
        setDrawing(drawingRef.current);
        return;
      }
      const last = c.points[c.points.length - 1];
      const next =
        activeTool === "orthogonal"
          ? orthogonalPoint(last.x, last.y, p.x, p.y, Math.abs(p.x - last.x) >= Math.abs(p.y - last.y))
          : p;
      drawingRef.current = { ...c, points: [...c.points, next] };
      setDrawing(drawingRef.current);
    },
    [activeTool, canvasPoint, clear],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, artboardRef: React.RefObject<HTMLDivElement>) => {
      if (drawingRef.current?.tool === "freehand") {
        const p = canvasPoint(e, artboardRef);
        if (p) {
          const c = drawingRef.current;
          drawingRef.current = { ...c, points: [...c.points, p] };
          setDrawing(drawingRef.current);
        }
        return;
      }
      // Drag tools: the second point follows the pointer until release.
      const current = drawingRef.current;
      if ((current?.tool === "line" || current?.tool === "star") && current.points.length >= 1) {
        const p = canvasPoint(e, artboardRef);
        if (p) {
          drawingRef.current = { ...current, points: [current.points[0], p] };
          setDrawing(drawingRef.current);
        }
      }
    },
    [canvasPoint],
  );
  const resetTool = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    drawingRef.current = null;
    setDrawing(null);
  }, []);
  return {
    activeTool,
    drawing,
    drawingRef,
    setActiveTool,
    resetTool,
    finishDrawing,
    onPointerDown,
    onPointerMove,
  };
}
