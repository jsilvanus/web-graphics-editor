import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { GraphicsAsset, Layer, TextAlign, VerticalAlign } from "../../types";

export const TextProperties: FC<{ layer: Layer; assets: GraphicsAsset[]; onStyle: (key: string, value: string) => void; onText: (text: string) => void; onFont: (asset: GraphicsAsset) => void }> = ({ layer, assets, onStyle, onText, onFont }) => {
  const ts = layer.textStyle ?? {};
  const fonts = assets.filter(a => a.type === "font");
  const setTextStyle = (key: string, value: string) => onStyle(key, value);
  const uploadFont = (file: File) => { const reader = new FileReader(); reader.onload = () => { const id = `font-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; const family = file.name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]+/g, " ").trim() || "Project Font"; onFont({ id, name: file.name, url: String(reader.result), type: "font", mimeType: file.type || undefined, size: file.size, metadata: { family } }); setTextStyle("font-family", family); }; reader.readAsDataURL(file); };
  const selectedFont = fonts.find(a => a.id === ts.fontAssetId);
  const weight = String(ts.fontWeight ?? styleValue(layer, "font-weight", "400"));
  const fontStyle = ts.fontStyle ?? "normal";
  const align = (ts.textAlign ?? styleValue(layer, "text-align", "left")) as TextAlign;
  const pathDirection = styleValue(layer, "text-path-direction", "forward");
  return <div className="ge-section">
    <b>Text</b>
    <label>Content<textarea value={layer.text ?? ""} rows={5} onChange={e => onText(e.target.value)} /></label>
    <div className="ge-text-toolbar" role="toolbar" aria-label="Typography" style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0" }}>
      <button type="button" aria-pressed={weight === "700" || weight === "800" || weight === "900"} title="Bold" onClick={() => setTextStyle("font-weight", weight === "700" || weight === "800" || weight === "900" ? "400" : "700")}>B</button>
      <button type="button" aria-pressed={fontStyle === "italic"} title="Italic" onClick={() => setTextStyle("font-style", fontStyle === "italic" ? "normal" : "italic")}>I</button>
      <button type="button" aria-pressed={align === "left"} title="Align left" onClick={() => setTextStyle("text-align", "left")}>L</button>
      <button type="button" aria-pressed={align === "center"} title="Align center" onClick={() => setTextStyle("text-align", "center")}>C</button>
      <button type="button" aria-pressed={align === "right"} title="Align right" onClick={() => setTextStyle("text-align", "right")}>R</button>
      <span style={{ width: 1, background: "currentColor", opacity: .25 }} />
      <label style={{ margin: 0 }}>Size <input aria-label="Font size" type="number" min="1" value={ts.fontSize ?? parseFloat(styleValue(layer, "font-size", "72px"))} onChange={e => setTextStyle("font-size", e.target.value)} style={{ width: 64 }} /></label>
    </div>
    <label>Font family<select value={ts.fontAssetId ?? ""} onChange={e => { const a = fonts.find(x => x.id === e.target.value); if (a) { onFont(a); setTextStyle("font-family", String(a.metadata?.family ?? a.name)); } else setTextStyle("font-family", e.target.value); }}><option value="">{ts.fontFamily ?? styleValue(layer, "font-family", "Arial, sans-serif")}</option><option value="Arial, sans-serif">Arial</option><option value="Helvetica, Arial, sans-serif">Helvetica</option><option value="Georgia, serif">Georgia</option><option value="Times New Roman, serif">Times New Roman</option><option value="Verdana, sans-serif">Verdana</option>{fonts.map(a => <option key={a.id} value={a.id}>{String(a.metadata?.family ?? a.name)}</option>)}</select></label>
    {selectedFont && <small>Project font: {selectedFont.name}</small>}
    <label>Add font<input type="file" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFont(f); e.currentTarget.value = ""; }} /></label>
    <div className="ge-two"><label>Weight<select value={weight} onChange={e => setTextStyle("font-weight", e.target.value)}>{["300", "400", "500", "600", "700", "800", "900"].map(x => <option key={x}>{x}</option>)}</select></label><label>Style<select value={fontStyle} onChange={e => setTextStyle("font-style", e.target.value)}><option value="normal">Normal</option><option value="italic">Italic</option></select></label></div>
    <div className="ge-two"><label>Align<select value={align} onChange={e => setTextStyle("text-align", e.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><label>Vertical<select value={ts.verticalAlign ?? "top"} onChange={e => setTextStyle("vertical-align", e.target.value as VerticalAlign)}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label></div>
    <div className="ge-two"><label>Line height<input value={ts.lineHeight ?? "1.2"} onChange={e => setTextStyle("line-height", e.target.value)} /></label><label>Letter spacing<input value={ts.letterSpacing ?? "0px"} onChange={e => setTextStyle("letter-spacing", e.target.value)} /></label></div>
    <div className="ge-two"><label>Wrap<select value={ts.wrap ?? "word"} onChange={e => setTextStyle("white-space", e.target.value === "none" ? "nowrap" : "pre-wrap")}><option value="word">Word</option><option value="none">No wrap</option><option value="character">Character</option></select></label><label>Overflow<select value={ts.overflow ?? (ts.wrap === "none" ? "visible" : "hidden")} onChange={e => setTextStyle("overflow", e.target.value)}><option value="hidden">Clip</option><option value="visible">Visible</option></select></label></div>
    <div className="ge-two"><label>Text path layer ID<input value={styleValue(layer, "text-path-layer-id", "")} placeholder="e.g. path-1" onChange={e => onStyle("text-path-layer-id", e.target.value)} /></label><label>Path offset %<input type="number" min="-100" max="200" value={styleValue(layer, "text-path-start-offset", "0")} onChange={e => onStyle("text-path-start-offset", String(Number(e.target.value)))} /></label></div>
    <label>Path direction<select value={pathDirection} onChange={e => onStyle("text-path-direction", e.target.value)}><option value="forward">Forward</option><option value="reverse">Reverse</option></select></label>
    <small>Attach the text to a path or line layer. Direction changes text traversal without changing the path geometry.</small>
    <small>Resize the selected text box with its handles. Double-click the text on the canvas to edit it directly.</small>
    <label>Color<input value={styleValue(layer, "color", "#fff")} onChange={e => onStyle("color", e.target.value)} /></label><label>Text shadow<input value={styleValue(layer, "text-shadow")} onChange={e => onStyle("text-shadow", e.target.value)} /></label><label>Text stroke<input value={styleValue(layer, "-webkit-text-stroke")} onChange={e => onStyle("-webkit-text-stroke", e.target.value)} /></label>
  </div>;
};
