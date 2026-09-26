/**
 * Base stylesheet for `GraphicsEditor`, injected by the component itself so hosts get a usable
 * editor without importing CSS. Everything is scoped under `.graphics-editor` / `ge-*` classes.
 *
 * The artboard is scaled with a CSS transform; `--ge-zoom` is set on it so canvas chrome (handles,
 * outlines) can stay a constant on-screen size.
 */
export const EDITOR_STYLES = `
.graphics-editor {
  --ge-bg: #111827;
  --ge-bg-deep: #0b1220;
  --ge-bg-canvas: #0f172a;
  --ge-border: #263244;
  --ge-control: #1f2937;
  --ge-control-border: #374151;
  --ge-text: #e5e7eb;
  --ge-muted: #94a3b8;
  --ge-accent: #38bdf8;
  --ge-active: #164e63;
  background: var(--ge-bg);
  color: var(--ge-text);
  border: 1px solid var(--ge-border);
  border-radius: 10px;
  overflow: hidden;
  font: 13px system-ui, sans-serif;
}
.graphics-editor *, .graphics-editor *::before, .graphics-editor *::after { box-sizing: border-box; }
.graphics-editor button {
  background: var(--ge-control);
  color: var(--ge-text);
  border: 1px solid var(--ge-control-border);
  border-radius: 5px;
  padding: 5px 9px;
  font: inherit;
  cursor: pointer;
}
.graphics-editor button:hover:not(:disabled) { border-color: var(--ge-accent); }
.graphics-editor button:disabled { opacity: .45; cursor: not-allowed; }
.graphics-editor button.ge-active, .graphics-editor button[aria-pressed="true"] { background: var(--ge-active); }
.graphics-editor input, .graphics-editor select, .graphics-editor textarea {
  background: var(--ge-bg-deep);
  color: var(--ge-text);
  border: 1px solid var(--ge-control-border);
  border-radius: 5px;
  padding: 5px 7px;
  font: inherit;
  min-width: 0;
}
.graphics-editor input[type="checkbox"], .graphics-editor input[type="radio"] { width: auto; }
.graphics-editor input[type="color"] { padding: 2px; height: 30px; }

.ge-toolbar {
  display: flex;
  gap: 5px;
  padding: 8px;
  background: var(--ge-bg-deep);
  border-bottom: 1px solid var(--ge-border);
  flex-wrap: wrap;
  align-items: center;
}
.ge-spacer { flex: 1; }

.ge-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; }

.ge-canvas-wrap { background: var(--ge-bg-canvas); min-width: 0; }
.ge-viewport { height: clamp(420px, 62vh, 900px); background: var(--ge-bg-canvas); }
.ge-viewport-controls button { padding: 3px 8px; }
.ge-canvas { overflow: hidden; touch-action: none; }
.ge-artboard {
  position: absolute;
  left: 0;
  top: 0;
  box-shadow: 0 0 0 1px #334155, 0 8px 30px rgba(0, 0, 0, .45);
}
.ge-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(#38bdf822 1px, transparent 1px),
    linear-gradient(90deg, #38bdf822 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 300;
}
.ge-guide { display: none; }
.ge-safe { position: absolute; pointer-events: none; border: 1px dashed rgba(255, 255, 0, .6); z-index: 1000; }
.safe90 { left: 5%; right: 5%; top: 5%; bottom: 5%; }
.safe80 { left: 10%; right: 10%; top: 10%; bottom: 10%; border-color: rgba(255, 140, 0, .6); }
.ge-handle, .ge-rotate {
  position: absolute;
  width: calc(10px / var(--ge-zoom, 1));
  height: calc(10px / var(--ge-zoom, 1));
  transform: translate(-50%, -50%);
  background: #fff;
  border: calc(1.5px / var(--ge-zoom, 1)) solid var(--ge-accent);
  z-index: 10;
}
.ge-rotate { border-radius: 50%; cursor: grab; }

.ge-properties {
  padding: 10px 12px;
  background: var(--ge-bg);
  border-left: 1px solid var(--ge-border);
  overflow: auto;
  max-height: clamp(420px, 62vh, 900px);
}
.ge-section { display: grid; gap: 7px; padding: 10px 0; border-bottom: 1px solid var(--ge-border); }
.ge-section:first-child { padding-top: 0; }
.ge-section > b, .ge-properties h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--ge-muted);
  margin: 0;
}
.ge-section label { display: grid; gap: 3px; font-size: 12px; color: var(--ge-muted); }
.ge-section label:has(> input[type="checkbox"]) { display: flex; align-items: center; gap: 6px; }
.ge-section input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
.ge-section select, .ge-section textarea { width: 100%; }
.ge-two { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.ge-property-buttons { display: flex; flex-wrap: wrap; gap: 4px; }

.ge-layer-list { display: grid; gap: 2px; }
.ge-layer-list button { text-align: left; }
.ge-layer-list .ge-layer-selected { background: var(--ge-active); }

.ge-timeline {
  position: relative;
  padding: 10px 14px 14px;
  background: var(--ge-bg-deep);
  border-top: 1px solid var(--ge-border);
  overflow: auto;
}
.ge-timeline-head { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
.ge-timeline-subhead { color: var(--ge-muted); font-size: 12px; margin: 6px 0; }
.ge-timeline-ruler {
  display: flex !important;
  justify-content: space-between;
  color: #64748b;
  font-size: 11px;
  margin-bottom: 2px;
  user-select: none;
}
.ge-timeline-body {
  position: relative;
  min-height: 40px;
  background: var(--ge-bg);
  border: 1px solid var(--ge-border);
  border-radius: 4px;
  min-width: 500px;
  cursor: col-resize;
}
.ge-scene {
  position: absolute;
  top: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  background: #1e293b;
  border: 1px solid var(--ge-control-border);
  border-radius: 4px;
  cursor: pointer;
}
.ge-scene:focus-visible { outline: 2px solid var(--ge-accent); }
.ge-scene-actions button { padding: 1px 6px; }
.ge-clip-cell { position: relative; min-height: 30px; flex: 1 1 300px; background: var(--ge-bg); border-radius: 4px; }
.ge-clip { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; gap: 4px; padding: 0 4px; overflow: hidden; }
.ge-clip input { width: 56px; padding: 2px 4px; }
.ge-clip button { padding: 1px 6px; }
.ge-scene-tree, .ge-3d-tree { display: grid; gap: 2px; margin-top: 8px; }
.ge-tree-row, .ge-tree-object, .ge-3d-object { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ge-tree-label { color: var(--ge-muted); font-size: 12px; }
.ge-tree-empty { color: #64748b; font-size: 12px; font-style: italic; }
.ge-3d-children { padding-left: 14px; }
.ge-scene-controls, .ge-scene-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ge-track-list { min-width: 700px; }
.ge-track-key-area { position: relative; min-height: 20px; flex: 1; }
.ge-key-editor { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
.ge-clip { background: #1e3a5f; border: 1px solid #2563eb; border-radius: 4px; }
.ge-playhead { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #f97316; pointer-events: none; z-index: 5; }

.ge-playback {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  background: var(--ge-bg-deep);
  border-top: 1px solid var(--ge-border);
}
.ge-playback span { font-variant-numeric: tabular-nums; color: var(--ge-muted); }

@media (max-width: 850px) {
  .ge-layout { grid-template-columns: 1fr; }
  .ge-properties { border-left: 0; border-top: 1px solid var(--ge-border); max-height: none; }
}
`;
