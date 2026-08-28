import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { Layer } from "../../types";

export const ShapeProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void }> = ({ layer, onStyle }) => (
  <div className="ge-section">
    <b>{layer.type === "ellipse" ? "Ellipse" : "Rectangle"}</b>
    <label>Fill<input value={styleValue(layer, "background", layer.type === "ellipse" ? "#fff" : "#111")} onChange={e => onStyle("background", e.target.value)} /></label>
    <label>Gradient<select value={styleValue(layer,"backgroundImage","none")} onChange={e=>onStyle("backgroundImage",e.target.value)}><option value="none">None</option><option value="linear-gradient(90deg, #fff, #000)">Linear</option><option value="radial-gradient(circle, #fff, #000)">Radial</option></select></label>
    <label>Stroke<input value={styleValue(layer, "border")} onChange={e => onStyle("border", e.target.value)} /></label>
    <label>Border radius<input value={styleValue(layer, "border-radius")} onChange={e => onStyle("border-radius", e.target.value)} /></label>
    <label>Shadow<select value={styleValue(layer,"boxShadow","none")} onChange={e=>onStyle("boxShadow",e.target.value)}><option value="none">None</option><option value="4px 4px 12px rgba(0,0,0,.35)">Soft</option><option value="0 0 20px rgba(0,0,0,.5)">Glow</option></select></label>
    <label>Custom shadow<input value={styleValue(layer,"boxShadow")} placeholder="0 4px 12px rgba(0,0,0,.3)" onChange={e=>onStyle("boxShadow",e.target.value)}/></label>
  </div>
);
