import type { FC, PointerEvent } from "react";
import type { Keyframe } from "../../types";

export interface TimelineKeyMarkersProps {
  keyframes: Keyframe[];
  total: number;
  selectedKeyId?: string;
  onSelect: (keyframeId: string) => void;
  onMove: (keyframeId: string, time: number) => void;
  onDelete: (keyframeId: string) => void;
}

export const TimelineKeyMarkers: FC<TimelineKeyMarkersProps> = ({ keyframes, total, selectedKeyId, onSelect, onMove, onDelete }) => {
  const pointerDown = (event: PointerEvent<HTMLButtonElement>, keyframeId: string) => {
    event.stopPropagation();
    onSelect(keyframeId);
    const body = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!body) return;
    const move = (moveEvent: globalThis.PointerEvent) => {
      const time = Math.max(0, Math.min(total, ((moveEvent.clientX - body.left) / body.width) * total));
      onMove(keyframeId, time);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return <>{keyframes.map(keyframe => <button key={keyframe.id} className={selectedKeyId === keyframe.id ? "ge-key ge-key-selected" : "ge-key"} style={{ left: `${keyframe.time / total * 100}%` }} onPointerDown={event => pointerDown(event, keyframe.id)} onDoubleClick={() => onDelete(keyframe.id)} title="Double-click to delete">◆</button>)}</>;
};
