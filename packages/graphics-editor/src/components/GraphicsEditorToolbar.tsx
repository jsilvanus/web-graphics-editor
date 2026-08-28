import type { FC } from "react";
import type { LayerType } from "../types";

export const GraphicsEditorToolbar: FC<{
  grid: boolean; safe: boolean; canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
  onAdd: (type: LayerType) => void;
  onDuplicate: () => void; onDelete: () => void;
  onToggleGrid: () => void; onToggleSafe: () => void;
  onTool: (tool: "select" | "line" | "path" | "orthogonal") => void;
  activeTool: "select" | "line" | "path" | "orthogonal";
}> = ({ grid, safe, canUndo, canRedo, onUndo, onRedo, onAdd, onDuplicate, onDelete, onToggleGrid, onToggleSafe, onTool, activeTool }) => (
  <div className="ge-toolbar" aria-label="Graphic tools">
    <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button>
    <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷ Redo</button>
    <span className="ge-spacer" />
    <button className={activeTool === "select" ? "ge-active" : ""} onClick={() => onTool("select")}>↖ Select</button>
    <button className={activeTool === "line" ? "ge-active" : ""} onClick={() => onTool("line")}>╱ Line</button>
    <button className={activeTool === "path" ? "ge-active" : ""} onClick={() => onTool("path")}>⌁ Path</button>
    <button className={activeTool === "orthogonal" ? "ge-active" : ""} onClick={() => onTool("orthogonal")}>⌞ Orthogonal</button>
    <span className="ge-spacer" />
    <button onClick={() => onAdd("text")}>＋ Text</button>
    <button onClick={() => onAdd("rectangle")}>＋ Rectangle</button>
    <button onClick={() => onAdd("ellipse")}>＋ Ellipse</button>
    <button onClick={() => onAdd("image")}>＋ Image</button>
    <button onClick={onDuplicate}>Duplicate</button>
    <button onClick={onDelete}>Delete</button>
    <button className={grid ? "ge-active" : ""} onClick={onToggleGrid}>Grid</button>
    <button className={safe ? "ge-active" : ""} onClick={onToggleSafe}>Safe area</button>
  </div>
);
