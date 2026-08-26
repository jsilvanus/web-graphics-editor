import { useMemo, useState } from "react";
import type { GraphicsEditorProps, Layer, LayerType } from "./types";

const initialId = "title";

function newLayer(type: LayerType, index: number): Layer {
  const id = `${type}-${index}`;
  if (type === "text") return { id, type, x: 160, y: 300, width: 1600, height: 180, text: "Text", style: { fontSize: "92px", fontWeight: 700, color: "#fff", textAlign: "center" } };
  return { id, type, x: 460, y: 300, width: 1000, height: type === "ellipse" ? 440 : 500, style: { background: type === "ellipse" ? "#fff" : "#111" } };
}

export function GraphicsEditor({ document, assets = [], onChange }: GraphicsEditorProps) {
  const [selectedId, setSelectedId] = useState(document.layers[0]?.id ?? null);
  const selected = document.layers.find((layer) => layer.id === selectedId) ?? null;
  const [grid, setGrid] = useState(false);
  const nextIndex = useMemo(() => document.layers.length + 1, [document.layers.length]);

  const update = (patch: Partial<Layer>) => {
    if (!selected) return;
    onChange({ ...document, layers: document.layers.map((l) => l.id === selected.id ? { ...l, ...patch } : l) });
  };

  const add = (type: LayerType) => {
    const layer = newLayer(type, nextIndex);
    onChange({ ...document, layers: [...document.layers, layer] });
    setSelectedId(layer.id);
  };

  const remove = () => {
    if (!selected) return;
    const layers = document.layers.filter((l) => l.id !== selected.id);
    onChange({ ...document, layers });
    setSelectedId(layers[0]?.id ?? null);
  };

  return (
    <div className="wge">
      <div className="wge-toolbar">
        <strong>Graphics Editor</strong>
        <button onClick={() => add("text")}>Text</button>
        <button onClick={() => add("rectangle")}>Rectangle</button>
        <button onClick={() => add("ellipse")}>Ellipse</button>
        <button onClick={() => add("image")}>Image</button>
        <span className="spacer" />
        <button onClick={() => setGrid((v) => !v)}>{grid ? "Hide grid" : "Grid"}</button>
        <button onClick={remove} disabled={!selected}>Delete</button>
      </div>
      <div className="wge-body">
        <div className="wge-canvas-wrap">
          <div className="wge-canvas" style={{ aspectRatio: `${document.width}/${document.height}` }}>
            <div className="wge-artboard" style={{ background: document.background ?? "#111" }}>
              {grid && <div className="wge-grid" />}
              {document.layers.map((layer) => (
                <div key={layer.id} className={`wge-layer ${layer.id === selectedId ? "selected" : ""}`} onClick={() => setSelectedId(layer.id)} style={{ left: `${layer.x / document.width * 100}%`, top: `${layer.y / document.height * 100}%`, width: `${layer.width / document.width * 100}%`, height: `${layer.height / document.height * 100}%`, transform: `rotate(${layer.rotation ?? 0}deg)`, ...layer.style }}>
                  {layer.type === "text" ? layer.text : layer.type === "image" && layer.src ? <img src={layer.src} alt="" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="wge-properties">
          <h3>Properties</h3>
          {selected ? <>
            <label>X<input type="number" value={selected.x} onChange={(e) => update({ x: Number(e.target.value) })} /></label>
            <label>Y<input type="number" value={selected.y} onChange={(e) => update({ y: Number(e.target.value) })} /></label>
            <label>Width<input type="number" value={selected.width} onChange={(e) => update({ width: Number(e.target.value) })} /></label>
            <label>Height<input type="number" value={selected.height} onChange={(e) => update({ height: Number(e.target.value) })} /></label>
            {selected.type === "text" && <label>Text<textarea value={selected.text ?? ""} onChange={(e) => update({ text: e.target.value })} /></label>}
            {selected.type === "image" && assets.length > 0 && <label>Asset<select value={selected.src ?? ""} onChange={(e) => update({ src: e.target.value })}><option value="">Select…</option>{assets.map((asset) => <option key={asset.id} value={asset.url}>{asset.name}</option>)}</select></label>}
          </> : <p>Select an object.</p>}
        </aside>
      </div>
      <style>{`
        .wge{font:14px system-ui,sans-serif;color:#e5e7eb;background:#111827;border:1px solid #263244;border-radius:10px;overflow:hidden}
        .wge-toolbar{display:flex;gap:6px;align-items:center;padding:9px;background:#0b1220;border-bottom:1px solid #263244}.wge-toolbar button{background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:5px;padding:6px 10px;cursor:pointer}.wge-toolbar button:disabled{opacity:.4}.spacer{flex:1}
        .wge-body{display:grid;grid-template-columns:minmax(0,1fr) 260px;min-height:520px}.wge-canvas-wrap{padding:18px;display:flex;align-items:flex-start;justify-content:center;background:#0f172a;overflow:auto}.wge-canvas{width:min(100%,960px);position:relative}.wge-artboard{position:absolute;inset:0;overflow:hidden}.wge-grid{position:absolute;inset:0;background-image:linear-gradient(#38bdf822 1px,transparent 1px),linear-gradient(90deg,#38bdf822 1px,transparent 1px);background-size:10% 10%;pointer-events:none}.wge-layer{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;white-space:pre-wrap}.wge-layer.selected{outline:2px solid #38bdf8;outline-offset:2px}.wge-layer img{width:100%;height:100%;object-fit:contain}.wge-properties{padding:14px;background:#111827;border-left:1px solid #263244}.wge-properties h3{margin-top:0}.wge-properties label{display:grid;gap:4px;margin:10px 0;color:#94a3b8;font-size:12px}.wge-properties input,.wge-properties select,.wge-properties textarea{box-sizing:border-box;width:100%;padding:7px;background:#0b1220;color:#e5e7eb;border:1px solid #374151;border-radius:5px}.wge-properties textarea{min-height:70px}
        @media(max-width:800px){.wge-body{grid-template-columns:1fr}.wge-properties{border-left:0;border-top:1px solid #263244}}
      `}</style>
    </div>
  );
}

export const defaultGraphicsDocument = { width: 1920, height: 1080, background: "#111", layers: [{ id: initialId, type: "text" as const, x: 160, y: 300, width: 1600, height: 180, text: "Hello graphics editor", style: { fontSize: "92px", fontWeight: 700, color: "#fff", textAlign: "center" } }] };
