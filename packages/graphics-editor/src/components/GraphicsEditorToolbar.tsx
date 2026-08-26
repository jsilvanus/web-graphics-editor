import type { FC } from "react";
import type { LayerType } from "../types";

export const GraphicsEditorToolbar: FC<{
  grid: boolean; safe: boolean; canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
  onAdd: (type: LayerType) => void;
  onDuplicate: () => void; onDelete: () => void;
  onToggleGrid: () => void; onToggleSafe: () => void;
}> = ({ grid, safe, canUndo, canRedo, onUndo, onRedo, onAdd, onDuplicate, onDelete, onToggleGrid, onToggleSafe }) => (
  <div className="ge-toolbar" aria-label="Graphic tools">
    <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button>
    <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷ Redo</button>
    <span className="ge-spacer" />
    <button onClick={() => onAdd("text")}>＋ Text</button>
    <button onClick={() => onAdd("rectangle")}>＋ Rectangle</button>
    <button onClick={() => onAdd("ellipse")}>＋ Ellipse</button>
    <button onClick={() => onAdd("image")}>＋ Image</button>
    <span className="ge-spacer" />
    <button onClick={onDuplicate}>Duplicate</button>
    <button onClick={onDelete}>Delete</button>
    <button className={grid ? "ge-active" : ""} onClick={onToggleGrid}>Grid</button>
    <button className={safe ? "ge-active" : ""} onClick={onToggleSafe}>Safe area</button>
  </div>
);
