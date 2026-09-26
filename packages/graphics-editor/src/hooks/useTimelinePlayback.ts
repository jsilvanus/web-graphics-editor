import { useEffect, useRef } from "react";
import { timelineDuration } from "../timeline";
import type { SceneTimeline } from "../types";

/** Advances the timeline's current time with requestAnimationFrame while `playing` is true. */
export function useTimelinePlayback(
  playing: boolean,
  setPlaying: (value: boolean) => void,
  setTimeline: (next: SceneTimeline) => void,
  timeline: SceneTimeline,
) {
  // The loop runs for the whole play session; it reads the latest values through refs so that
  // each frame's timeline update does not restart it.
  const latest = useRef({ timeline, setTimeline, setPlaying });
  latest.current = { timeline, setTimeline, setPlaying };

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      const { timeline: current, setTimeline: update, setPlaying: setPlayingState } = latest.current;
      const total = timelineDuration(current);
      const next = current.currentTime + dt;
      if (next >= total) {
        if (current.loop && total > 0) update({ ...current, currentTime: next % total });
        else {
          update({ ...current, currentTime: total });
          setPlayingState(false);
          return;
        }
      } else if (dt > 0) update({ ...current, currentTime: next });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
}
