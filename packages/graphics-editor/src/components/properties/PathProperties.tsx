import type { FC } from "react";
import type { Layer } from "../../types";

export const PathProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void }> = ({ layer, onStyle }) => (
  <div className="ge-section">
    <b>{layer.type === "line" ? "Line" : "Path"}</b>
    {layer.type === "path" && <label>Fill<input value={String(layer.style?.fill ?? "none")} onChange={e => onStyle("fill", e.target.value)} placeholder="none / #ffffff" /></label>}
    <label>Stroke<input value={String(layer.style?.stroke ?? "#ffffff")} onChange={e => onStyle("stroke", e.target.value)} /></label>
    <label>Stroke width<input type="number" min="0" step="0.5" value={Number(layer.style?.["stroke-width"] ?? 4)} onChange={e => onStyle("stroke-width", e.target.value)} /></label>
    <div className="ge-two">
      <label>Cap<select value={String(layer.style?.["stroke-linecap"] ?? "round")} onChange={e => onStyle("stroke-linecap", e.target.value)}><option>butt</option><option>round</option><option>square</option></select></label>
      <label>Join<select value={String(layer.style?.["stroke-linejoin"] ?? "round")} onChange={e => onStyle("stroke-linejoin", e.target.value)}><option>miter</option><option>round</option><option>bevel</option></select></label>
    </div>
  </div>
);
