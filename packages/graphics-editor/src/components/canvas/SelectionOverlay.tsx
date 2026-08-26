import type { FC } from "react";
import type { Layer } from "../../types";

export const SelectionOverlay: FC<{ layers: Layer[]; selectedIds: Set<string> }> = ({ layers, selectedIds }) => <>{layers.filter(layer => selectedIds.has(layer.id)).map(layer => <div key={layer.id} aria-hidden="true" style={{ position: "absolute", left: layer.x, top: layer.y, width: layer.width, height: layer.height, border: "1px dashed rgba(56,189,248,.45)", pointerEvents: "none", boxSizing: "border-box" }} />)}</>;
