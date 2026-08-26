import type { FC } from "react";
import { ANIMATIONS } from "../../constants";
import { parsePx, styleValue } from "../../geometry";
import type { GraphicsAsset, Layer } from "../../types";

export const LayerProperties: FC<{
  layer: Layer;
  assets: GraphicsAsset[];
  aspectLock: boolean;
  onLayer: (id: string, patch: Partial<Layer>) => void;
  onStyle: (id: string, key: string, value: string | number) => void;
  onChooseAsset: (asset: GraphicsAsset) => void;
  onToggleAssetPicker: () => void;
  onAspectLock: (value: boolean) => void;
  assetPicker: boolean;
}> = ({ layer, assets, aspectLock, onLayer, onStyle, onChooseAsset, onToggleAssetPicker, onAspectLock, assetPicker }) => (
  <>
    <div className="ge-section"><b>Layer: {layer.id}</b><label>Type<span>{layer.type}</span></label>
      {layer.type === "text" && <label>Text<textarea value={layer.text ?? ""} onChange={e => onLayer(layer.id, { text: e.target.value })} /></label>}
      {layer.type === "image" && <label>Image<button onClick={onToggleAssetPicker}>{layer.src ? "Change image" : "Choose image"}</button></label>}
      <div className="ge-two"><label>X<input type="number" value={layer.x} onChange={e => onLayer(layer.id, { x: Number(e.target.value) })} /></label><label>Y<input type="number" value={layer.y} onChange={e => onLayer(layer.id, { y: Number(e.target.value) })} /></label></div>
      <div className="ge-two"><label>Width<input type="number" min="20" value={layer.width} onChange={e => onLayer(layer.id, { width: Number(e.target.value) })} /></label><label>Height<input type="number" min="20" value={layer.height} onChange={e => onLayer(layer.id, { height: Number(e.target.value) })} /></label></div>
      <label>Rotation<input type="number" value={layer.rotation ?? 0} onChange={e => onLayer(layer.id, { rotation: Number(e.target.value) })} /></label>
      <label>Opacity<input type="range" min="0" max="1" step="0.01" value={parsePx(layer.style?.opacity, 1)} onChange={e => onStyle(layer.id, "opacity", e.target.value)} /></label>
      {layer.type === "text" && <><label>Font family<input value={styleValue(layer, "font-family", "Arial, sans-serif")} onChange={e => onStyle(layer.id, "font-family", e.target.value)} /></label><label>Font size<input value={styleValue(layer, "font-size", "72px")} onChange={e => onStyle(layer.id, "font-size", e.target.value)} /></label><div className="ge-two"><label>Weight<select value={styleValue(layer, "font-weight", "700")} onChange={e => onStyle(layer.id, "font-weight", e.target.value)}><option>normal</option><option>bold</option><option>400</option><option>500</option><option>600</option><option>700</option><option>800</option><option>900</option></select></label><label>Align<select value={styleValue(layer, "text-align", "center")} onChange={e => onStyle(layer.id, "text-align", e.target.value)}><option>left</option><option>center</option><option>right</option></select></label></div><label>Color<input value={styleValue(layer, "color", "#fff")} onChange={e => onStyle(layer.id, "color", e.target.value)} /></label><label>Text shadow<input value={styleValue(layer, "text-shadow")} onChange={e => onStyle(layer.id, "text-shadow", e.target.value)} /></label><label>Text stroke<input value={styleValue(layer, "-webkit-text-stroke")} onChange={e => onStyle(layer.id, "-webkit-text-stroke", e.target.value)} /></label></>}
      {(layer.type === "rect" || layer.type === "ellipse") && <label>Background<input value={styleValue(layer, "background", layer.type === "ellipse" ? "#fff" : "#000")} onChange={e => onStyle(layer.id, "background", e.target.value)} /></label>}
      <label>Animation<select value={(layer.animation ?? "").split(" ")[0]} onChange={e => onLayer(layer.id, { animation: e.target.value ? `${e.target.value} 1s ease 0s 1 normal forwards` : undefined })}>{ANIMATIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Aspect lock</span><input type="checkbox" checked={aspectLock} onChange={e => onAspectLock(e.target.checked)} /></label>
    </div>
    {assetPicker && <div className="ge-section"><b>Assets</b>{assets.map(asset => <button key={asset.id} onClick={() => onChooseAsset(asset)}>{asset.name}</button>)}{!assets.length && <span>No image assets.</span>}</div>}
  </>
);
