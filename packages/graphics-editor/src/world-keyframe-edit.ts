import type { Graphics3DAnimatedProperty, Graphics3DWorld } from "./types";
import { upsert3DKeyframe } from "./3d-timeline";

const id = () => `3d-keyframe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface WorldEditResult { world: Graphics3DWorld; trackId: string; keyframeId: string; created: boolean }

/**
 * Edit an animated world property at the current world time.
 * An existing keyframe at the same time is updated; otherwise a new keyframe is created.
 */
export function editWorldPropertyAtTime(
  world: Graphics3DWorld,
  targetType: "mesh" | "camera",
  targetId: string,
  property: Graphics3DAnimatedProperty,
  time: number,
  value: number,
): WorldEditResult {
  const tracks = world.timeline?.tracks ?? [];
  const existing = tracks.find(t => t.targetType === targetType && t.targetId === targetId && t.property === property);
  const trackId = existing?.id ?? `3d-track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const keyframe = existing?.keyframes.find(k => Math.abs(k.time - time) < 0.0001);
  const next = upsert3DKeyframe(
    existing ? world : { ...world, timeline: { ...(world.timeline ?? {}), tracks: [...tracks, { id: trackId, targetType, targetId, property, keyframes: [] }] } },
    trackId,
    { id: keyframe?.id ?? id(), time: Math.max(0, time), value },
  );
  return { world: next, trackId, keyframeId: keyframe?.id ?? (next.timeline?.tracks.find(t => t.id === trackId)?.keyframes.find(k => Math.abs(k.time - time) < 0.0001)?.id ?? ""), created: !keyframe };
}
