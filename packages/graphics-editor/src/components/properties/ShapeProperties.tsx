import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { Layer } from "../../types";

export const ShapeProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void }> = ({ layer, onStyle }) => (
  <div className="ge-section">
    <b>{layer.type === "ellipse" ? "Ellipse" : "Rectangle"}</b>
    <label>Background<input value={styleValue(layer, "background", layer.type === "ellipse" ? "#fff" : "#111")} onChange={e => onStyle("background", e.target.value)} /></label>
    <label>Border<input value={styleValue(layer, "border")} onChange={e => onStyle("border", e.target.value)} /></label>
    <label>Border radius<input value={styleValue(layer, "border-radius")} onChange={e => onStyle("border-radius", e.target.value)} /></label>
  </div>
);
