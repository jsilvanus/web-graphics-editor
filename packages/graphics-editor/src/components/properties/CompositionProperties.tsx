import type { FC } from "react";
import type { Composition, Layer } from "../../types";

export const CompositionProperties: FC<{
  layer: Layer;
  composition: Composition | undefined;
  compositions: Composition[];
  onLayer: (patch: Partial<Layer>) => void;
  onComposition: (patch: Partial<Composition>) => void;
  onEnter: () => void;
}> = ({ layer, composition, compositions, onLayer, onComposition, onEnter }) => (
  <div className="ge-section">
    <b>Composition</b>
    <label>
      Source
      <select
        value={layer.compositionId ?? ""}
        onChange={e => onLayer({ compositionId: e.target.value || undefined })}
      >
        <option value="">None</option>
        {compositions.map(item => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
    {composition && (
      <>
        <label>
          Name
          <input value={composition.name} onChange={e => onComposition({ name: e.target.value })} />
        </label>
        <label>
          Duration
          <input
            type="number"
            min="0"
            step="0.1"
            value={composition.duration ?? 0}
            onChange={e => onComposition({ duration: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={composition.loop ?? false}
            onChange={e => onComposition({ loop: e.target.checked })}
          />{" "}
          Loop
        </label>
        <label>
          Offset
          <input
            type="number"
            step="0.1"
            value={layer.timeOffset ?? 0}
            onChange={e => onLayer({ timeOffset: Number(e.target.value) })}
          />
        </label>
        <label>
          Playback rate
          <input
            type="number"
            min="0"
            step="0.1"
            value={layer.playbackRate ?? 1}
            onChange={e => onLayer({ playbackRate: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <button type="button" onClick={onEnter}>
          Edit composition
        </button>
      </>
    )}
  </div>
);
