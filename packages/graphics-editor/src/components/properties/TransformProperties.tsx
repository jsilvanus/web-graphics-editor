import type { FC } from "react";
import type { Layer } from "../../types";

export const TransformProperties: FC<{
  layer: Layer;
  aspectLock: boolean;
  onLayer: (patch: Partial<Layer>) => void;
  onAspectLock: (value: boolean) => void;
}> = ({ layer, aspectLock, onLayer, onAspectLock }) => (
  <div className="ge-section">
    <b>Transform</b>
    <div className="ge-two">
      <label>X<input type="number" value={layer.x} onChange={e => onLayer({ x: Number(e.target.value) })} /></label>
      <label>Y<input type="number" value={layer.y} onChange={e => onLayer({ y: Number(e.target.value) })} /></label>
    </div>
    <div className="ge-two">
      <label>Width<input type="number" min="20" value={layer.width} onChange={e => onLayer({ width: Number(e.target.value) })} /></label>
      <label>Height<input type="number" min="20" value={layer.height} onChange={e => onLayer({ height: Number(e.target.value) })} /></label>
    </div>
    <label>Rotation<input type="number" value={layer.rotation ?? 0} onChange={e => onLayer({ rotation: Number(e.target.value) })} /></label>
    <label><span>Aspect lock</span><input type="checkbox" checked={aspectLock} onChange={e => onAspectLock(e.target.checked)} /></label>
  </div>
);
