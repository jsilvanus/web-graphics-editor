import { useRef, useState } from "react";
import { GraphicsEditorCanvas } from "./components/GraphicsEditorCanvas";
import { GraphicsEditorToolbar } from "./components/GraphicsEditorToolbar";
import { LayerList } from "./components/LayerList";
import { LayerProperties } from "./components/properties/LayerProperties";
import { HEIGHT, KEYFRAMES, WIDTH } from "./constants";
import { resizeLayer, snap } from "./geometry";
import type { GraphicsEditorProps, Layer, LayerType } from "./types";

function newLayer(type: LayerType, index: number): Layer {
  const id = `${type}-${index}`;
  if (type === "text") return { id, type, x: 160, y: 300, width: 1600, height: 180, text: "Text", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } };
  if (type === "image") return { id, type, x: 460, y: 300, width: 1000, height: 500 };
  return { id, type, x: 460, y: 300, width: 1000, height: type === "ellipse" ? 440 : 500, style: { background: type === "ellipse" ? "#fff" : "#111" } };
}

export function GraphicsEditor({ document, assets = [], onChange }: GraphicsEditorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(document.layers[0] ? [document.layers[0].id] : []));
  const [primaryId, setPrimaryId] = useState(document.layers[0]?.id ?? null);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [aspectLock, setAspectLock] = useState(true);
  const [assetPicker, setAssetPicker] = useState(false);
  const artboardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ kind: string; layerId: string; handle?: string; startX: number; startY: number; layer: Layer; scale: number; left: number; top: number } | null>(null);

  const primary = document.layers.find(layer => layer.id === primaryId) ?? null;
  const select = (id: string, additive = false) => {
    const next = additive ? new Set(selectedIds) : new Set<string>();
    if (additive && next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next); setPrimaryId(id);
  };
  const updateLayer = (id: string, patch: Partial<Layer>) => onChange({ ...document, layers: document.layers.map(l => l.id === id ? { ...l, ...patch } : l) });
  const updateStyle = (id: string, key: string, value: string | number) => {
    const layer = document.layers.find(l => l.id === id); if (!layer) return;
    const style = { ...(layer.style ?? {}) }; if (value === "") delete style[key]; else style[key] = value;
    updateLayer(id, { style });
  };
  const add = (type: LayerType) => { const layer = newLayer(type, Date.now()); onChange({ ...document, layers: [...document.layers, layer] }); select(layer.id); };
  const remove = () => { if (!selectedIds.size) return; const layers = document.layers.filter(l => !selectedIds.has(l.id)); onChange({ ...document, layers }); const first = layers[0]; setSelectedIds(first ? new Set([first.id]) : new Set()); setPrimaryId(first?.id ?? null); };
  const duplicate = () => { const selected = document.layers.filter(l => selectedIds.has(l.id)); if (!selected.length) return; const copies = selected.map(l => ({ ...l, id: `${l.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: l.x + 30, y: l.y + 30 })); onChange({ ...document, layers: [...document.layers, ...copies] }); setSelectedIds(new Set(copies.map(l => l.id))); setPrimaryId(copies[0].id); };

  const pointerDown = (event: React.PointerEvent, id: string, kind: string, handle?: string) => {
    event.stopPropagation(); const layer = document.layers.find(l => l.id === id); const rect = artboardRef.current?.getBoundingClientRect();
    if (!layer || !rect?.width) return;
    if (kind === "move" && !event.shiftKey) select(id); else if (kind === "move") select(id, true);
    if (kind === "move" || kind === "resize" || kind === "rotate") {
      dragRef.current = { kind, layerId: id, handle, startX: event.clientX, startY: event.clientY, layer: { ...layer }, scale: rect.width / (document.width || WIDTH), left: rect.left, top: rect.top };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
  };
  const pointerMove = (event: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = (event.clientX - d.startX) / d.scale, dy = (event.clientY - d.startY) / d.scale;
    let patch: Partial<Layer>;
    if (d.kind === "move") { let x = d.layer.x + dx, y = d.layer.y + dy; if (grid) { x = snap(x); y = snap(y); } patch = { x: Math.round(x), y: Math.round(y) }; }
    else if (d.kind === "resize") { const r = resizeLayer(d.handle ?? "se", d.layer, dx, dy); if (aspectLock) { const ratio = d.layer.width / d.layer.height; if (["e", "w"].includes(d.handle ?? "")) r.height = Math.max(20, Math.round(r.width / ratio)); else if (["n", "s"].includes(d.handle ?? "")) r.width = Math.max(20, Math.round(r.height * ratio)); } patch = r; }
    else { const cx = d.layer.x + d.layer.width / 2, cy = d.layer.y + d.layer.height / 2; const px = (event.clientX - d.left) / d.scale, py = (event.clientY - d.top) / d.scale; let angle = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90; if (grid) angle = Math.round(angle / 15) * 15; patch = { rotation: Math.round(angle) }; }
    onChange({ ...document, layers: document.layers.map(l => l.id === d.layerId ? { ...l, ...patch } : l) });
  };
  const pointerUp = () => { dragRef.current = null; };

  return <div className="graphics-editor">
    <style>{KEYFRAMES}</style>
    <GraphicsEditorToolbar grid={grid} safe={safe} onAdd={add} onDuplicate={duplicate} onDelete={remove} onToggleGrid={() => setGrid(v => !v)} onToggleSafe={() => setSafe(v => !v)} />
    <div className="ge-layout">
      <GraphicsEditorCanvas artboardRef={artboardRef} layers={document.layers} selectedIds={selectedIds} grid={grid} safe={safe} background={document.background ?? "#111"} onPointerMove={pointerMove} onPointerUp={pointerUp} onCanvasPointerDown={() => { setSelectedIds(new Set()); setPrimaryId(null); }} onLayerPointerDown={pointerDown} />
      <aside className="ge-properties">
        <LayerList layers={document.layers} selectedIds={selectedIds} onSelect={id => select(id)} />
        {primary ? <LayerProperties layer={primary} assets={assets} aspectLock={aspectLock} assetPicker={assetPicker} onLayer={updateLayer} onStyle={updateStyle} onChooseAsset={asset => { updateLayer(primary.id, { src: asset.url }); setAssetPicker(false); }} onToggleAssetPicker={() => setAssetPicker(v => !v)} onAspectLock={setAspectLock} /> : <div className="ge-section"><span>Select a layer.</span></div>}
      </aside>
    </div>
    <style>{`.graphics-editor{background:#111827;color:#e5e7eb;border:1px solid #263244;border-radius:10px;overflow:hidden;font:14px system-ui,sans-serif}.ge-toolbar{display:flex;gap:6px;padding:9px;background:#0b1220;border-bottom:1px solid #263244;flex-wrap:wrap}.ge-toolbar button,.ge-properties button{background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:5px;padding:7px 10px;cursor:pointer}.ge-toolbar button.ge-active{background:#164e63}.ge-spacer{flex:1}.ge-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;min-height:620px}.ge-canvas-wrap{padding:18px;display:flex;align-items:flex-start;justify-content:center;background:#0f172a;overflow:auto}.ge-canvas{width:min(100%,960px);aspect-ratio:${WIDTH}/${HEIGHT};position:relative}.ge-artboard{position:absolute;inset:0;overflow:hidden}.ge-grid{position:absolute;inset:0;background-image:linear-gradient(#38bdf822 1px,transparent 1px),linear-gradient(90deg,#38bdf822 1px,transparent 1px);background-size:${100/96}% ${100/54}%;pointer-events:none}.ge-safe{position:absolute;pointer-events:none;border:1px dashed rgba(255,255,0,.6);z-index:1000}.safe90{left:5%;right:5%;top:5%;bottom:5%}.safe80{left:10%;right:10%;top:10%;bottom:10%;border-color:rgba(255,140,0,.6)}.ge-handle{position:absolute;width:12px;height:12px;background:#38bdf8;border:2px solid #fff;border-radius:2px;transform:translate(-50%,-50%);z-index:20}.ge-rotate{position:absolute;width:12px;height:12px;background:#f472b6;border:2px solid #fff;border-radius:50%;transform:translate(-50%,-50%);z-index:20}.ge-properties{padding:14px;background:#111827;border-left:1px solid #263244;overflow:auto}.ge-section{display:grid;gap:8px;padding:10px 0;border-bottom:1px solid #263244}.ge-section>b{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}.ge-section label{display:grid;gap:4px;font-size:12px;color:#94a3b8}.ge-section input,.ge-section select,.ge-section textarea{width:100%;box-sizing:border-box;background:#0b1220;color:#e5e7eb;border:1px solid #374151;border-radius:5px;padding:7px}.ge-two{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ge-layer-list{display:grid;gap:4px}.ge-layer-list button{display:flex;justify-content:space-between;text-align:left}.ge-layer-list .ge-layer-selected{background:#164e63}@media(max-width:850px){.ge-layout{grid-template-columns:1fr}.ge-properties{border-left:0;border-top:1px solid #263244}}`}</style>
  </div>;
}

export const defaultGraphicsDocument = { width: WIDTH, height: HEIGHT, background: "#111", layers: [{ id: "title", type: "text" as const, x: 160, y: 300, width: 1600, height: 180, text: "Hello graphics editor", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } }] };
