import type { FC } from "react";
import type { GraphicsAsset, Layer } from "../../types";

export const ImageProperties: FC<{
  layer: Layer;
  assets: GraphicsAsset[];
  onLayer: (patch: Partial<Layer>) => void;
  onTogglePicker: () => void;
  onChooseAsset: (asset: GraphicsAsset) => void;
  pickerOpen: boolean;
}> = ({ layer, assets, onLayer, onTogglePicker, onChooseAsset, pickerOpen }) => (
  <>
    <div className="ge-section">
      <b>Image</b>
      <button onClick={onTogglePicker}>{layer.src ? "Change image" : "Choose image"}</button>
      {layer.src && (
        <img
          src={layer.src}
          alt="Selected asset"
          style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
        />
      )}
      <label>
        Crop / fit
        <select
          value={String(layer.style?.["object-fit"] ?? "contain")}
          onChange={e => onLayer({ style: { ...(layer.style ?? {}), "object-fit": e.target.value } })}
        >
          <option>contain</option>
          <option>cover</option>
          <option>fill</option>
        </select>
      </label>
      <label>
        Crop position
        <input
          value={String(layer.style?.["object-position"] ?? "50% 50%")}
          onChange={e => onLayer({ style: { ...(layer.style ?? {}), "object-position": e.target.value } })}
          placeholder="50% 50%"
        />
      </label>
      <label>
        Mask
        <select
          value={String(layer.style?.["clip-path"] ?? "none")}
          onChange={e => onLayer({ style: { ...(layer.style ?? {}), "clip-path": e.target.value } })}
        >
          <option value="none">None</option>
          <option value="circle(50%)">Circle</option>
          <option value="inset(5% round 8%)">Rounded inset</option>
          <option value="ellipse(50% 45% at 50% 50%)">Ellipse</option>
        </select>
      </label>
      <label>
        Mask CSS
        <input
          value={String(layer.style?.["clip-path"] ?? "none")}
          onChange={e => onLayer({ style: { ...(layer.style ?? {}), "clip-path": e.target.value } })}
          placeholder="polygon(...), inset(...), circle(...)"
        />
      </label>
      <label>
        Brightness
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={Number(layer.style?.["--image-brightness"] ?? 1)}
          onChange={e =>
            onLayer({
              style: {
                ...(layer.style ?? {}),
                "--image-brightness": e.target.value,
                filter: `brightness(${e.target.value}) contrast(${Number(layer.style?.["--image-contrast"] ?? 1)}) saturate(${Number(layer.style?.["--image-saturation"] ?? 1)})`,
              },
            })
          }
        />
      </label>
      <label>
        Contrast
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={Number(layer.style?.["--image-contrast"] ?? 1)}
          onChange={e =>
            onLayer({
              style: {
                ...(layer.style ?? {}),
                "--image-contrast": e.target.value,
                filter: `brightness(${Number(layer.style?.["--image-brightness"] ?? 1)}) contrast(${e.target.value}) saturate(${Number(layer.style?.["--image-saturation"] ?? 1)})`,
              },
            })
          }
        />
      </label>
      <label>
        Saturation
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={Number(layer.style?.["--image-saturation"] ?? 1)}
          onChange={e =>
            onLayer({
              style: {
                ...(layer.style ?? {}),
                "--image-saturation": e.target.value,
                filter: `brightness(${Number(layer.style?.["--image-brightness"] ?? 1)}) contrast(${Number(layer.style?.["--image-contrast"] ?? 1)}) saturate(${e.target.value})`,
              },
            })
          }
        />
      </label>
    </div>
    {pickerOpen && (
      <div className="ge-section">
        <b>Assets</b>
        {assets.map(asset => (
          <button key={asset.id} onClick={() => onChooseAsset(asset)}>
            {asset.name}
          </button>
        ))}
        {assets.length === 0 && <span>No image assets supplied.</span>}
      </div>
    )}
  </>
);
