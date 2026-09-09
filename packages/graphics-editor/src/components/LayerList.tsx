import { useMemo, useState, type FC } from "react";
import type { Layer } from "../types";
import { getChildLayers, getRootLayers } from "../layer-tree";

export const LayerList: FC<{
  layers: Layer[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onForward?: (id: string) => void;
  onBackward?: (id: string) => void;
  onFront?: (id: string) => void;
  onBack?: (id: string) => void;
  onGroup?: () => void;
  onUngroup?: (id: string) => void;
}> = ({ layers, selectedIds, onSelect, onForward, onBackward, onFront, onBack, onGroup, onUngroup }) => {
  const roots = useMemo(() => [...getRootLayers(layers)].reverse(), [layers]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setCollapsed(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const renderLayer = (layer: Layer, depth: number): React.ReactNode => {
    const children = getChildLayers(layers, layer.id);
    const isGroup = layer.type === "group";
    const isCollapsed = collapsed.has(layer.id);
    return <div key={layer.id}>
      <div style={{ display: "grid", gridTemplateColumns: isGroup ? "20px minmax(0,1fr) auto" : "20px minmax(0,1fr)", alignItems: "center", gap: 4, paddingLeft: depth * 14 }}>
        {isGroup ? <button type="button" aria-label={isCollapsed ? `Expand ${layer.id}` : `Collapse ${layer.id}`} onClick={() => toggle(layer.id)} style={{ padding: 0, width: 20 }}>{isCollapsed ? "▸" : "▾"}</button> : <span />}
        <button type="button" className={selectedIds.has(layer.id) ? "ge-layer-selected" : ""} onClick={() => onSelect(layer.id)} style={{ minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ opacity: .7, marginRight: 6 }}>{layer.type}</span><span>{layer.id}</span>
        </button>
        <span style={{ display: "flex", gap: 2 }}>
          {onForward && <button type="button" title="Bring forward" aria-label="Bring forward" onClick={() => onForward(layer.id)}>↑</button>}
          {onBackward && <button type="button" title="Send backward" aria-label="Send backward" onClick={() => onBackward(layer.id)}>↓</button>}
          {onFront && <button type="button" title="Bring to front" aria-label="Bring to front" onClick={() => onFront(layer.id)}>⇈</button>}
          {onBack && <button type="button" title="Send to back" aria-label="Send to back" onClick={() => onBack(layer.id)}>⇊</button>}
          {isGroup && onUngroup && <button type="button" title="Ungroup" onClick={() => onUngroup(layer.id)}>↗</button>}
        </span>
      </div>
      {isGroup && !isCollapsed && children.slice().reverse().map(child => renderLayer(child, depth + 1))}
    </div>;
  };

  return <div className="ge-section">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <b>Layers</b>
      {onGroup && selectedIds.size >= 2 && <button type="button" onClick={onGroup}>Group</button>}
    </div>
    <div className="ge-layer-list">
      {roots.map(layer => renderLayer(layer, 0))}
      {!layers.length && <span>No layers.</span>}
    </div>
  </div>;
};
