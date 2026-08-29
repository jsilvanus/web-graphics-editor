import type { FC, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import type { Layer } from "../../types";

export const LayerFrame: FC<{ layer: Layer; frameLayer?: Layer; selected: boolean; multiSelected: boolean; children: ReactNode; onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void }> = ({ layer, frameLayer = layer, selected, multiSelected, children, onPointerDown }) => (
  <div style={layerStyle(frameLayer, selected)} onPointerDown={event => onPointerDown(event, "move")}>
    {children}
    {selected && !multiSelected && <>
      <ResizeHandles layer={frameLayer} onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)} />
      <RotateHandle layer={frameLayer} onPointerDown={event => onPointerDown(event, "rotate")} />
    </>}
  </div>
);
