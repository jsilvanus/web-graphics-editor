import type { FC } from "react";
import type { Gradient, Layer } from "../../types";
import { GradientProperties } from "./GradientProperties";

export const PathProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void; onLayer?: (patch: Partial<Layer>) => void; onGradient?: (gradient: Gradient | undefined) => void; onOffset?: (distance: number) => void }> = ({ layer, onStyle, onLayer, onGradient, onOffset }) => {
  const reversed = String(layer.style?.["path-direction"] ?? "forward") === "reverse";
  return <div className="ge-section">
    <b>{layer.type === "line" ? "Line" : "Path"}</b>
    {layer.type === "path" && <label>Fill rule<select value={String(layer.style?.["fill-rule"] ?? "nonzero")} onChange={e => onStyle("fill-rule", e.target.value)}><option value="nonzero">Non-zero</option><option value="evenodd">Even-odd</option></select></label>}
    {layer.type === "path" && <label>Fill<input value={String(layer.style?.fill ?? "none")} onChange={e => onStyle("fill", e.target.value)} placeholder="none / #ffffff" /></label>}{layer.type === "path" && onGradient && <GradientProperties gradient={layer.gradient} onGradient={onGradient}/>}
    <label>Stroke<input value={String(layer.style?.stroke ?? "#ffffff")} onChange={e => onStyle("stroke", e.target.value)} /></label>
    <label>Stroke width<input type="number" min="0" step="0.5" value={Number(layer.style?.["stroke-width"] ?? 4)} onChange={e => onStyle("stroke-width", e.target.value)} /></label>
    <div className="ge-two">
      <label>Cap<select value={String(layer.style?.["stroke-linecap"] ?? "round")} onChange={e => onStyle("stroke-linecap", e.target.value)}><option>butt</option><option>round</option><option>square</option></select></label>
      <label>Join<select value={String(layer.style?.["stroke-linejoin"] ?? "round")} onChange={e => onStyle("stroke-linejoin", e.target.value)}><option>miter</option><option>round</option><option>bevel</option></select></label>
    </div>
    {layer.type === "path" && <label>Offset<input type="number" step="1" defaultValue="10" onKeyDown={e => { if(e.key==="Enter") onOffset?.(Number((e.target as HTMLInputElement).value)); }} /><button type="button" onClick={e => { const input=(e.currentTarget.previousElementSibling as HTMLInputElement); onOffset?.(Number(input.value)); }}>Apply offset</button></label>}
    {layer.type === "path" && <div className="ge-two"><button type="button" onClick={() => onLayer?.({ closed: !layer.closed })}>{layer.closed ? "Open path" : "Close path"}</button><button type="button" onClick={() => onStyle("path-direction", reversed ? "forward" : "reverse")}>Reverse</button></div>}
    <label>Direction<select value={reversed ? "reverse" : "forward"} onChange={e => onStyle("path-direction", e.target.value)}><option value="forward">Forward</option><option value="reverse">Reverse</option></select></label>
    <small>Double-click a segment to add a node. Drag nodes or Bézier handles. Double-click a node toggles corner/smooth. Alt/Option-drag makes a handle independent. Delete removes selected nodes.</small>
  </div>;
};
