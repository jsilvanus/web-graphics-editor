import { useEffect, useRef } from "react";
import { timelineDuration } from "../timeline";
import type { SceneTimeline } from "../types";

export function useTimelinePlayback(playing: boolean, setPlaying: (v: boolean) => void, setTimeline: (next: SceneTimeline) => void, timeline: SceneTimeline) {
  const frame = useRef<number | null>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(() => {
    if (!playing) { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; return; }
    let last: number | null = null;
    const tick = (now: number) => {
      if (!playingRef.current) return;
      const dt = last === null ? 0 : (now - last) / 1000; last = now;
      const total = timelineDuration(timeline);
      const next = timeline.currentTime + dt;
      if (next >= total) {
        if (timeline.loop) setTimeline({ ...timeline, currentTime: total > 0 ? next % total : 0 });
        else { setTimeline({ ...timeline, currentTime: total }); setPlaying(false); }
      } else setTimeline({ ...timeline, currentTime: next });
      if (playingRef.current) frame.current = requestAnimationFrame(tick); else frame.current = null;
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; };
  }, [playing, setPlaying, setTimeline, timeline]);
}
