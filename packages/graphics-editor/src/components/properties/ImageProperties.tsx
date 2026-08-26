import type { FC } from "react";
import type { GraphicsAsset, Layer } from "../../types";

export const ImageProperties: FC<{ layer: Layer; assets: GraphicsAsset[]; onLayer: (patch: Partial<Layer>) => void; onTogglePicker: () => void; onChooseAsset: (asset: GraphicsAsset) => void; pickerOpen: boolean }> = ({ layer, assets, onLayer, onTogglePicker, onChooseAsset, pickerOpen }) => (
  <>
    <div className="ge-section">
      <b>Image</b>
      <button onClick={onTogglePicker}>{layer.src ? "Change image" : "Choose image"}</button>
      {layer.src && <img src={layer.src} alt="Selected asset" style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }} />}
      <label>Object fit<select value={String(layer.style?.["object-fit"] ?? "contain")} onChange={e => onLayer({ style: { ...(layer.style ?? {}), "object-fit": e.target.value } })}><option>contain</option><option>cover</option><option>fill</option></select></label>
    </div>
    {pickerOpen && <div className="ge-section"><b>Assets</b>{assets.map(asset => <button key={asset.id} onClick={() => onChooseAsset(asset)}>{asset.name}</button>)}{assets.length === 0 && <span>No image assets supplied.</span>}</div>}
  </>
);
