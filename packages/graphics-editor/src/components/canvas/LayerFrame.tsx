import type { FC, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import type { Layer } from "../../types";

export const LayerFrame: FC<{
  layer: Layer;
  frameLayer?: Layer;
  selected: boolean;
  multiSelected: boolean;
  children: ReactNode;
  onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
  /** The frame captures the pointer while dragging, so double-clicks land here rather than on the content. */
  onDoubleClick?: () => void;
}> = ({ layer, frameLayer = layer, selected, multiSelected, children, onPointerDown, onDoubleClick }) => (
  <div
    style={layerStyle(frameLayer, selected)}
    onPointerDown={event => onPointerDown(event, "move")}
    onDoubleClick={onDoubleClick}
  >
    {children}
    {selected && !multiSelected && (
      <>
        <ResizeHandles
          layer={frameLayer}
          onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)}
        />
        <RotateHandle layer={frameLayer} onPointerDown={event => onPointerDown(event, "rotate")} />
      </>
    )}
  </div>
);
