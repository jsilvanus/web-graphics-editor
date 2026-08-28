import type { FC } from "react";

export interface TimelineKeyframeEditorValue {
  time: number;
  value: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface TimelineKeyframeEditorProps {
  value?: TimelineKeyframeEditorValue;
  onTimeChange: (time: number) => void;
  onValueChange: (value: number) => void;
  onEasingChange: (easing: NonNullable<TimelineKeyframeEditorValue["easing"]>) => void;
  onDelete: () => void;
}

export const TimelineKeyframeEditor: FC<TimelineKeyframeEditorProps> = ({ value, onTimeChange, onValueChange, onEasingChange, onDelete }) => {
  if (!value) return null;
  return (
    <div className="ge-key-editor">
      <b>Keyframe</b>
      <label>Time<input type="number" min="0" step="0.01" value={value.time} onChange={e => onTimeChange(Number(e.target.value) || 0)} /></label>
      <label>Value<input type="number" step="0.01" value={value.value} onChange={e => onValueChange(Number(e.target.value) || 0)} /></label>
      <label>Easing<select value={value.easing ?? "linear"} onChange={e => onEasingChange(e.target.value as NonNullable<TimelineKeyframeEditorValue["easing"]>)}><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in/out</option></select></label>
      <button onClick={onDelete}>Delete keyframe</button>
    </div>
  );
};
