import type { FC } from "react";
import type { Layer } from "../types";

export const LayerList: FC<{
  layers: Layer[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}> = ({ layers, selectedIds, onSelect }) => (
  <div className="ge-section">
    <b>Layers</b>
    <div className="ge-layer-list">
      {[...layers].reverse().map(layer => (
        <button key={layer.id} className={selectedIds.has(layer.id) ? "ge-layer-selected" : ""} onClick={() => onSelect(layer.id)}>
          <span>{layer.type}</span><span>{layer.id}</span>
        </button>
      ))}
      {!layers.length && <span>No layers.</span>}
    </div>
  </div>
);
