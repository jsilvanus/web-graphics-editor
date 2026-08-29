import type { FC, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import type { Layer } from "../../types";

export const LayerFrame: FC<{ layer: Layer; selected: boolean; multiSelected: boolean; children: ReactNode; onPointerDown: (event: ReactPointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void }> = ({ layer, selected, multiSelected, children, onPointerDown }) => (
  <div style={layerStyle(layer, selected)} onPointerDown={event => onPointerDown(event, "move")}>
    {children}
    {selected && !multiSelected && <>
      <ResizeHandles layer={layer} onPointerDown={(event, handle) => onPointerDown(event, "resize", handle)} />
      <RotateHandle layer={layer} onPointerDown={event => onPointerDown(event, "rotate")} />
    </>}
  </div>
);
