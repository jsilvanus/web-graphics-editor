import { useMemo, useState, type FC, type ReactNode } from "react";
import type { Composition, Layer } from "../types";
import { getChildLayers, getRootLayers } from "../layer-tree";

export const LayerList: FC<{
  layers: Layer[];
  compositions?: Composition[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onForward?: (id: string) => void;
  onBackward?: (id: string) => void;
  onFront?: (id: string) => void;
  onBack?: (id: string) => void;
  onGroup?: () => void;
  onUngroup?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onMove?: (id: string, targetId: string, position: "inside" | "before" | "after") => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({
  layers,
  compositions = [],
  selectedIds,
  onSelect,
  onForward,
  onBackward,
  onFront,
  onBack,
  onGroup,
  onUngroup,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onMove,
  onDuplicate,
  onDelete,
}) => {
  const roots = useMemo(() => [...getRootLayers(layers)].reverse(), [layers]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const toggle = (id: string) =>
    setCollapsed(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const beginRename = (layer: Layer) => {
    if (!onRename) return;
    setEditingId(layer.id);
    setEditingName(layer.name ?? layer.id);
  };
  const commitRename = (layer: Layer) => {
    const name = editingName.trim();
    if (name && name !== layer.id) onRename?.(layer.id, name);
    setEditingId(null);
  };

  const renderLayer = (layer: Layer, depth: number): ReactNode => {
    const isGroup = layer.type === "group";
    const isComposition = layer.type === "composition";
    const children = isComposition
      ? (compositions.find(c => c.id === layer.compositionId)?.layerIds ?? [])
          .map(id => layers.find(item => item.id === id))
          .filter((item): item is Layer => !!item)
      : getChildLayers(layers, layer.id);
    const isCollapsed = collapsed.has(layer.id);
    return (
      <div
        key={layer.id}
        draggable={!layer.locked}
        onDragStart={() => setDraggedId(layer.id)}
        onDragEnd={() => setDraggedId(null)}
        onDragOver={event => {
          if (!draggedId || draggedId === layer.id) return;
          event.preventDefault();
        }}
        onDrop={event => {
          event.preventDefault();
          if (!draggedId || draggedId === layer.id) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientY - rect.top) / rect.height;
          const position =
            layer.type === "group" && ratio > 0.25 && ratio < 0.75
              ? "inside"
              : ratio < 0.5
                ? "before"
                : "after";
          onMove?.(draggedId, layer.id, position);
          setDraggedId(null);
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isGroup ? "20px minmax(0,1fr) auto" : "20px minmax(0,1fr)",
            alignItems: "center",
            gap: 4,
            paddingLeft: depth * 14,
          }}
        >
          {isGroup || isComposition ? (
            <button
              type="button"
              aria-label={
                isCollapsed ? `Expand ${layer.name ?? layer.id}` : `Collapse ${layer.name ?? layer.id}`
              }
              onClick={() => toggle(layer.id)}
              style={{ padding: 0, width: 20 }}
            >
              {isCollapsed ? "▸" : "▾"}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={selectedIds.has(layer.id) ? "ge-layer-selected" : ""}
            onClick={() => onSelect(layer.id)}
            onDoubleClick={() => beginRename(layer)}
            onContextMenu={event => {
              event.preventDefault();
              setMenu({ id: layer.id, x: event.clientX, y: event.clientY });
            }}
            style={{
              minWidth: 0,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {editingId === layer.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={event => setEditingName(event.target.value)}
                onClick={event => event.stopPropagation()}
                onKeyDown={event => {
                  event.stopPropagation();
                  if (event.key === "Enter") commitRename(layer);
                  if (event.key === "Escape") setEditingId(null);
                }}
                onBlur={() => commitRename(layer)}
                style={{ width: "100%" }}
              />
            ) : (
              <>
                <span style={{ opacity: 0.7, marginRight: 6 }}>{layer.type}</span>
                <span>{layer.name ?? layer.id}</span>
              </>
            )}
          </button>
          <span style={{ display: "flex", gap: 2 }}>
            {onToggleVisibility && (
              <button
                type="button"
                title={layer.visible === false ? "Show" : "Hide"}
                aria-label={layer.visible === false ? "Show" : "Hide"}
                onClick={event => {
                  event.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
              >
                {layer.visible === false ? "○" : "●"}
              </button>
            )}
            {onToggleLock && (
              <button
                type="button"
                title={layer.locked ? "Unlock" : "Lock"}
                aria-label={layer.locked ? "Unlock" : "Lock"}
                onClick={event => {
                  event.stopPropagation();
                  onToggleLock(layer.id);
                }}
              >
                {layer.locked ? "🔒" : "🔓"}
              </button>
            )}
            {onForward && (
              <button
                type="button"
                title="Bring forward"
                aria-label="Bring forward"
                onClick={() => onForward(layer.id)}
              >
                ↑
              </button>
            )}
            {onBackward && (
              <button
                type="button"
                title="Send backward"
                aria-label="Send backward"
                onClick={() => onBackward(layer.id)}
              >
                ↓
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                title="Duplicate"
                aria-label="Duplicate"
                onClick={() => onDuplicate(layer.id)}
              >
                ⧉
              </button>
            )}
            {onDelete && (
              <button type="button" title="Delete" aria-label="Delete" onClick={() => onDelete(layer.id)}>
                ×
              </button>
            )}
            {onFront && (
              <button
                type="button"
                title="Bring to front"
                aria-label="Bring to front"
                onClick={() => onFront(layer.id)}
              >
                ⇈
              </button>
            )}
            {onBack && (
              <button
                type="button"
                title="Send to back"
                aria-label="Send to back"
                onClick={() => onBack(layer.id)}
              >
                ⇊
              </button>
            )}
            {isGroup && onUngroup && (
              <button type="button" title="Ungroup" onClick={() => onUngroup(layer.id)}>
                ↗
              </button>
            )}
          </span>
        </div>
        {(isGroup || isComposition) &&
          !isCollapsed &&
          children
            .slice()
            .reverse()
            .map(child => renderLayer(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="ge-section" onClick={() => menu && setMenu(null)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <b>Layers</b>
        <span style={{ fontSize: 11, opacity: 0.55 }}>Double-click a name to rename</span>
        {onGroup && selectedIds.size >= 2 && (
          <button type="button" onClick={onGroup}>
            Group
          </button>
        )}
      </div>
      <div className="ge-layer-list">
        {roots.map(layer => renderLayer(layer, 0))}
        {!layers.length && <span>No layers.</span>}
      </div>
    </div>
  );
};
