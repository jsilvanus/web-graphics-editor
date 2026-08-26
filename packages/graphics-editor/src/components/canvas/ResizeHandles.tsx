import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { HANDLE_LIST } from "../../constants";
import { anchor } from "../../geometry";
import type { Layer } from "../../types";

export const ResizeHandles: FC<{ layer: Layer; onPointerDown: (event: ReactPointerEvent, handle: string) => void }> = ({ layer, onPointerDown }) => <>{HANDLE_LIST.map(handle => { const point = anchor(handle, layer); return <span key={handle} className="ge-handle" style={{ left: point.left, top: point.top, cursor: `${handle}-resize` }} onPointerDown={e => onPointerDown(e, handle)} />; })}</>;
