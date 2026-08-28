import type { FC } from "react";

export interface SceneTimelineRulerProps {
  total: number;
}

export const SceneTimelineRuler: FC<SceneTimelineRulerProps> = ({ total }) => (
  <div className="ge-timeline-ruler" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(total))}, 1fr)` }}>
    {Array.from({ length: Math.ceil(total) + 1 }, (_, i) => <span key={i}>{i}s</span>)}
  </div>
);
