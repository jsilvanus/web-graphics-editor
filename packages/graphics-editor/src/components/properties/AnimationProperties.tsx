import type { FC } from "react";
import { ANIMATIONS } from "../../constants";
import type { Layer } from "../../types";

export const AnimationProperties: FC<{ layer: Layer; onAnimation: (animation: string | undefined) => void }> = ({ layer, onAnimation }) => (
  <div className="ge-section">
    <b>Animation</b>
    <label>Animation<select value={(layer.animation ?? "").split(" ")[0]} onChange={e => onAnimation(e.target.value ? `${e.target.value} 1s ease 0s 1 normal forwards` : undefined)}>{ANIMATIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
  </div>
);
