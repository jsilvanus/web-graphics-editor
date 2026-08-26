import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Layer } from "../../types";

export const RotateHandle: FC<{ layer: Layer; onPointerDown: (event: ReactPointerEvent) => void }> = ({ layer, onPointerDown }) => <span className="ge-rotate" style={{ left: layer.width / 2, top: -32 }} onPointerDown={onPointerDown} />;
