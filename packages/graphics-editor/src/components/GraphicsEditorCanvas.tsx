import type { FC, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { WIDTH, HEIGHT } from "../constants";
import type { Layer } from "../types";
import { CanvasLayer } from "./canvas/CanvasLayer";
import { SelectionOverlay } from "./canvas/SelectionOverlay";

export const GraphicsEditorCanvas: FC<{
  artboardRef: RefObject<HTMLDivElement | null>; layers: Layer[]; selectedIds: Set<string>; grid: boolean; safe: boolean; background: string;
  onPointerMove: (event: ReactPointerEvent) => void; onPointerUp: () => void; onCanvasPointerDown: () => void;
  onLayerPointerDown: (event: ReactPointerEvent, id: string, kind: "move" | "resize" | "rotate", handle?: string) => void;
}> = ({ artboardRef, layers, selectedIds, grid, safe, background, onPointerMove, onPointerUp, onCanvasPointerDown, onLayerPointerDown }) => <div className="ge-canvas-wrap">
  <div className="ge-canvas" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onPointerDown={onCanvasPointerDown}>
    <div ref={artboardRef} className="ge-artboard" style={{ background }}>
      {grid && <div className="ge-grid" />}
      {layers.map(layer => <CanvasLayer key={layer.id} layer={layer} selected={selectedIds.has(layer.id)} onPointerDown={(event, kind, handle) => onLayerPointerDown(event, layer.id, kind, handle)} />)}
      <SelectionOverlay layers={layers} selectedIds={selectedIds} />
      {safe && <><div className="ge-safe safe90" /><div className="ge-safe safe80" /></>}
    </div>
  </div>
</div>;

export const canvasAspectRatio = `${WIDTH}/${HEIGHT}`;
