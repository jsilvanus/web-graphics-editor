import { useCallback, useEffect, useRef, useState } from "react";
import { GraphicsEditorCanvas } from "./components/GraphicsEditorCanvas";
import { GraphicsEditorToolbar } from "./components/GraphicsEditorToolbar";
import { LayerList } from "./components/LayerList";
import { LayerProperties } from "./components/properties/LayerProperties";
import { HEIGHT, KEYFRAMES, WIDTH } from "./constants";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useEditorTransaction } from "./hooks/useEditorTransaction";
import { useLayerOperations } from "./hooks/useLayerOperations";
import type { GraphicsEditorProps, GraphicsDocument } from "./types";

export function GraphicsEditor({ document: initialDocument, assets = [], onChange }: GraphicsEditorProps) {
  const { document, setDocument, undo, redo, canUndo, canRedo, resetHistory } = useEditorHistory(initialDocument);
  const { selectedIds, primaryId, select, clear } = useEditorSelection(document.layers[0]?.id ?? null);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [aspectLock, setAspectLock] = useState(true);
  const [assetPicker, setAssetPicker] = useState(false);
  const artboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { onChange?.(document); }, [document, onChange]);
  useEffect(() => {
    if (initialDocument !== document) resetHistory(initialDocument);
  }, [initialDocument, document, resetHistory]);

  const commit = useCallback((next: GraphicsDocument) => setDocument(next, true), [setDocument]);
  const transientChange = useCallback((next: GraphicsDocument) => setDocument(next, false), [setDocument]);
  const transaction = useEditorTransaction(commit);
  const { updateLayer, updateStyle, add, remove, duplicate } = useLayerOperations(setDocument);
  const interaction = useCanvasInteraction(document, artboardRef, grid, aspectLock, transientChange);

  useEditorKeyboard(undo, redo);

  const selectedLayer = document.layers.find(layer => layer.id === primaryId) ?? null;
  const addLayer = (type: Parameters<typeof add>[0]) => { const id = add(type); select(id); };
  const deleteSelected = () => { if (!selectedIds.size) return; remove(selectedIds); clear(); };
  const duplicateSelected = () => { if (!selectedIds.size) return; const ids = duplicate(selectedIds); if (ids.length) select(ids[0]); };
  const onPointerDown = (event: React.PointerEvent, id: string, kind: string, handle?: string) => {
    if (kind === "move") select(id, event.shiftKey);
    transaction.begin(document);
    interaction.pointerDown(event, id, kind, handle);
  };
  const onPointerMove = (event: React.PointerEvent) => interaction.pointerMove(event);
  const onPointerUp = () => {
    transaction.end(document);
    interaction.pointerUp();
  };

  return <div className="graphics-editor">
    <style>{KEYFRAMES}</style>
    <GraphicsEditorToolbar grid={grid} safe={safe} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onAdd={addLayer} onDuplicate={duplicateSelected} onDelete={deleteSelected} onToggleGrid={() => setGrid(v => !v)} onToggleSafe={() => setSafe(v => !v)} />
    <div className="ge-layout">
      <GraphicsEditorCanvas artboardRef={artboardRef} layers={document.layers} selectedIds={selectedIds} grid={grid} safe={safe} background={document.background ?? "#111"} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onCanvasPointerDown={clear} onLayerPointerDown={onPointerDown} />
      <aside className="ge-properties">
        <LayerList layers={document.layers} selectedIds={selectedIds} onSelect={id => select(id)} />
        {selectedLayer ? <LayerProperties layer={selectedLayer} assets={assets} aspectLock={aspectLock} assetPicker={assetPicker} onLayer={(id, patch) => updateLayer(id, patch)} onStyle={updateStyle} onChooseAsset={asset => { updateLayer(selectedLayer.id, { src: asset.url }); setAssetPicker(false); }} onToggleAssetPicker={() => setAssetPicker(v => !v)} onAspectLock={setAspectLock} /> : <div className="ge-section"><span>Select a layer.</span></div>}
      </aside>
    </div>
    <style>{`.graphics-editor{background:#111827;color:#e5e7eb;border:1px solid #263244;border-radius:10px;overflow:hidden;font:14px system-ui,sans-serif}.ge-toolbar{display:flex;gap:6px;padding:9px;background:#0b1220;border-bottom:1px solid #263244;flex-wrap:wrap}.ge-toolbar button,.ge-properties button{background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:5px;padding:7px 10px;cursor:pointer}.ge-toolbar button.ge-active{background:#164e63}.ge-toolbar button:disabled{opacity:.45;cursor:not-allowed}.ge-spacer{flex:1}.ge-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;min-height:620px}.ge-canvas-wrap{padding:18px;display:flex;align-items:flex-start;justify-content:center;background:#0f172a;overflow:auto}.ge-canvas{width:min(100%,960px);aspect-ratio:${WIDTH}/${HEIGHT};position:relative;touch-action:none}.ge-artboard{position:absolute;inset:0;overflow:hidden}.ge-grid{position:absolute;inset:0;background-image:linear-gradient(#38bdf822 1px,transparent 1px),linear-gradient(90deg,#38bdf822 1px,transparent 1px);background-size:${100/96}% ${100/54}%;pointer-events:none}.ge-safe{position:absolute;pointer-events:none;border:1px dashed rgba(255,255,0,.6);z-index:1000}.safe90{left:5%;right:5%;top:5%;bottom:5%}.safe80{left:10%;right:10%;top:10%;bottom:10%;border-color:rgba(255,140,0,.6)}.ge-handle{position:absolute;width:12px;height:12px;background:#38bdf8;border:2px solid #fff;border-radius:2px;transform:translate(-50%,-50%);z-index:20}.ge-rotate{position:absolute;width:12px;height:12px;background:#f472b6;border:2px solid #fff;border-radius:50%;transform:translate(-50%,-50%);z-index:20}.ge-properties{padding:14px;background:#111827;border-left:1px solid #263244;overflow:auto}.ge-section{display:grid;gap:8px;padding:10px 0;border-bottom:1px solid #263244}.ge-section>b{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}.ge-section label{display:grid;gap:4px;font-size:12px;color:#94a3b8}.ge-section input,.ge-section select,.ge-section textarea{width:100%;box-sizing:border-box;background:#0b1220;color:#e5e7eb;border:1px solid #374151;border-radius:5px;padding:7px}.ge-two{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ge-layer-list{display:grid;gap:4px}.ge-layer-list button{display:flex;justify-content:space-between;text-align:left}.ge-layer-list .ge-layer-selected{background:#164e63}@media(max-width:850px){.ge-layout{grid-template-columns:1fr}.ge-properties{border-left:0;border-top:1px solid #263244}}`}</style>
  </div>;
}

export const defaultGraphicsDocument: GraphicsDocument = { width: WIDTH, height: HEIGHT, background: "#111", layers: [{ id: "title", type: "text", x: 160, y: 300, width: 1600, height: 180, text: "Hello graphics editor", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } }] };
