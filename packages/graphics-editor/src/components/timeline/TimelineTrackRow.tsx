import type { FC, ReactNode } from "react";

export interface TimelineTrackRowProps {
  label: string;
  keyframeCount: number;
  onAdd: () => void;
  children?: ReactNode;
}

export const TimelineTrackRow: FC<TimelineTrackRowProps> = ({ label, keyframeCount, onAdd, children }) => (
  <div className="ge-timeline-track-row">
    <button onClick={onAdd}>{label}{keyframeCount ? ` · ${keyframeCount}` : " +"}</button>
    {children}
  </div>
);
