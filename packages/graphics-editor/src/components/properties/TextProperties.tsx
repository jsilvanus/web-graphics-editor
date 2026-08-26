import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { Layer } from "../../types";

export const TextProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void }> = ({ layer, onStyle }) => (
  <div className="ge-section">
    <b>Text</b>
    <label>Content<textarea value={layer.text ?? ""} onChange={e => onStyle("text", e.target.value)} /></label>
    <label>Font family<input value={styleValue(layer, "font-family", "Arial, sans-serif")} onChange={e => onStyle("font-family", e.target.value)} /></label>
    <label>Font size<input value={styleValue(layer, "font-size", "72px")} onChange={e => onStyle("font-size", e.target.value)} /></label>
    <div className="ge-two">
      <label>Weight<select value={styleValue(layer, "font-weight", "700")} onChange={e => onStyle("font-weight", e.target.value)}><option>normal</option><option>bold</option><option>400</option><option>500</option><option>600</option><option>700</option><option>800</option><option>900</option></select></label>
      <label>Align<select value={styleValue(layer, "text-align", "center")} onChange={e => onStyle("text-align", e.target.value)}><option>left</option><option>center</option><option>right</option></select></label>
    </div>
    <label>Color<input value={styleValue(layer, "color", "#fff")} onChange={e => onStyle("color", e.target.value)} /></label>
    <label>Text shadow<input value={styleValue(layer, "text-shadow")} onChange={e => onStyle("text-shadow", e.target.value)} /></label>
    <label>Text stroke<input value={styleValue(layer, "-webkit-text-stroke")} onChange={e => onStyle("-webkit-text-stroke", e.target.value)} /></label>
  </div>
);
