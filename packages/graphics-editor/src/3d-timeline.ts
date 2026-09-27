import type {
  AnimationKeyframe,
  AnimationValue,
  Graphics3DAnimatedProperty,
  Graphics3DAnimationTarget,
  Graphics3DTrack,
  Graphics3DWorld,
  InterpolationOptions,
  SceneTimeline,
} from "./types";

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/*
 * 3D tracks live in two places (see docs/WORLD-TIME-MODEL.md): a world's own timeline animates
 * meshes, cameras and lights; the main scene timeline (`SceneTimeline.tracks3d`) animates how 3D
 * views are presented. The track-list helpers below work on either; the world and scene variants
 * only choose where the list is stored.
 */

export function create3DTrack(
  targetType: Graphics3DAnimationTarget,
  targetId: string,
  property: Graphics3DAnimatedProperty,
): Graphics3DTrack {
  return { id: id("3d-track"), targetType, targetId, property, keyframes: [] };
}

export function upsert3DKeyframeInTracks(
  tracks: Graphics3DTrack[],
  trackId: string,
  keyframe: AnimationKeyframe,
): Graphics3DTrack[] {
  return tracks.map(track =>
    track.id !== trackId
      ? track
      : {
          ...track,
          keyframes: [
            ...track.keyframes.filter(k => k.id !== keyframe.id && Math.abs(k.time - keyframe.time) > 0.0001),
            keyframe,
          ].sort((a, b) => a.time - b.time),
        },
  );
}

export function remove3DKeyframeInTracks(
  tracks: Graphics3DTrack[],
  trackId: string,
  keyframeId: string,
): Graphics3DTrack[] {
  return tracks.map(track =>
    track.id === trackId ? { ...track, keyframes: track.keyframes.filter(k => k.id !== keyframeId) } : track,
  );
}

export function move3DKeyframeInTracks(
  tracks: Graphics3DTrack[],
  trackId: string,
  keyframeId: string,
  time: number,
): Graphics3DTrack[] {
  const key = tracks.find(t => t.id === trackId)?.keyframes.find(k => k.id === keyframeId);
  return key ? upsert3DKeyframeInTracks(tracks, trackId, { ...key, time: Math.max(0, time) }) : tracks;
}

// World timeline

function withWorldTracks(world: Graphics3DWorld, tracks: Graphics3DTrack[]): Graphics3DWorld {
  return { ...world, timeline: { ...(world.timeline ?? {}), tracks } };
}

export function add3DTrack(
  world: Graphics3DWorld,
  targetType: Graphics3DAnimationTarget,
  targetId: string,
  property: Graphics3DAnimatedProperty,
): Graphics3DWorld {
  return withWorldTracks(world, [
    ...(world.timeline?.tracks ?? []),
    create3DTrack(targetType, targetId, property),
  ]);
}
export function remove3DTrack(world: Graphics3DWorld, trackId: string): Graphics3DWorld {
  return withWorldTracks(
    world,
    (world.timeline?.tracks ?? []).filter(track => track.id !== trackId),
  );
}
export function keyframe3DAtTime(
  world: Graphics3DWorld,
  trackId: string,
  time: number,
  epsilon = 0.0001,
): AnimationKeyframe | undefined {
  return (world.timeline?.tracks ?? [])
    .find(t => t.id === trackId)
    ?.keyframes.find(k => Math.abs(k.time - time) <= epsilon);
}
export function set3DKeyframeAtTime(
  world: Graphics3DWorld,
  trackId: string,
  time: number,
  value: AnimationValue,
  interpolation?: InterpolationOptions,
): Graphics3DWorld {
  const track = (world.timeline?.tracks ?? []).find(t => t.id === trackId);
  if (!track) return world;
  const existing = keyframe3DAtTime(world, trackId, time);
  const key: AnimationKeyframe = {
    id: existing?.id ?? id("3d-key"),
    time,
    value,
    interpolation: interpolation ?? existing?.interpolation ?? { easing: { mode: "linear" } },
  };
  return upsert3DKeyframe(world, trackId, key);
}
export function upsert3DKeyframe(
  world: Graphics3DWorld,
  trackId: string,
  keyframe: AnimationKeyframe,
): Graphics3DWorld {
  return withWorldTracks(world, upsert3DKeyframeInTracks(world.timeline?.tracks ?? [], trackId, keyframe));
}
export function remove3DKeyframe(
  world: Graphics3DWorld,
  trackId: string,
  keyframeId: string,
): Graphics3DWorld {
  return withWorldTracks(world, remove3DKeyframeInTracks(world.timeline?.tracks ?? [], trackId, keyframeId));
}
export function move3DKeyframe(
  world: Graphics3DWorld,
  trackId: string,
  keyframeId: string,
  time: number,
): Graphics3DWorld {
  return withWorldTracks(
    world,
    move3DKeyframeInTracks(world.timeline?.tracks ?? [], trackId, keyframeId, time),
  );
}
export function tracks3DForTarget(
  world: Graphics3DWorld | undefined,
  targetType: Graphics3DAnimationTarget,
  targetId: string,
): Graphics3DTrack[] {
  return (world?.timeline?.tracks ?? []).filter(t => t.targetType === targetType && t.targetId === targetId);
}

// Scene (main) timeline

export function addScene3DTrack(
  timeline: SceneTimeline,
  targetType: Graphics3DAnimationTarget,
  targetId: string,
  property: Graphics3DAnimatedProperty,
): SceneTimeline {
  return {
    ...timeline,
    tracks3d: [...(timeline.tracks3d ?? []), create3DTrack(targetType, targetId, property)],
  };
}
export function upsertScene3DKeyframe(
  timeline: SceneTimeline,
  trackId: string,
  keyframe: AnimationKeyframe,
): SceneTimeline {
  return { ...timeline, tracks3d: upsert3DKeyframeInTracks(timeline.tracks3d ?? [], trackId, keyframe) };
}
export function removeScene3DKeyframe(
  timeline: SceneTimeline,
  trackId: string,
  keyframeId: string,
): SceneTimeline {
  return { ...timeline, tracks3d: remove3DKeyframeInTracks(timeline.tracks3d ?? [], trackId, keyframeId) };
}
export function moveScene3DKeyframe(
  timeline: SceneTimeline,
  trackId: string,
  keyframeId: string,
  time: number,
): SceneTimeline {
  return {
    ...timeline,
    tracks3d: move3DKeyframeInTracks(timeline.tracks3d ?? [], trackId, keyframeId, time),
  };
}

export function isAnimationValue(value: unknown): value is AnimationValue {
  return (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every(v => typeof v === "number"))
  );
}
