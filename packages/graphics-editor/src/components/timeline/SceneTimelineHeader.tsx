import type { FC } from "react";

export interface SceneTimelineHeaderProps {
  currentTime: number;
  total: number;
  loop: boolean;
  onSeek: (time: number) => void;
  onLoopChange: (value: boolean) => void;
  onDuplicate: () => void;
}

export const SceneTimelineHeader: FC<SceneTimelineHeaderProps> = ({ currentTime, total, loop, onSeek, onLoopChange, onDuplicate }) => (
  <div className="ge-timeline-head">
    <b>Timeline</b>
    <button onClick={() => onSeek(Math.max(0, currentTime - 0.5))}>◀</button>
    <button onClick={() => onSeek(Math.min(total, currentTime + 0.5))}>▶</button>
    <button onClick={() => onSeek(0)}>● 0</button>
    <label><input type="checkbox" checked={loop} onChange={e => onLoopChange(e.target.checked)} /> Loop</label>
    <button title="Duplicate the complete timeline after itself" onClick={onDuplicate}>⧉ Duplicate timeline</button>
    <span>{currentTime.toFixed(2)}s / {total.toFixed(2)}s</span>
  </div>
);
