import type { GraphicsDocument, SceneTimeline, AnimatedProperty, Keyframe, Track } from "../types";
import type { DocumentOperation } from "../history/operations";
import { createKeyframe, createTrack, upsertKeyframe } from "../timeline";

export interface TimelineCommandResult { document: GraphicsDocument; operation?: DocumentOperation }

export function setTimelineCommand(document: GraphicsDocument, timeline: SceneTimeline | undefined): TimelineCommandResult {
  if (JSON.stringify(document.timeline) === JSON.stringify(timeline)) return { document };
  return { document: { ...document, timeline }, operation: { type: "set-timeline", from: document.timeline, to: timeline } };
}

export function updateTimelineCommand(document: GraphicsDocument, updater: (timeline: SceneTimeline) => SceneTimeline, fallback: SceneTimeline): TimelineCommandResult {
  const current = document.timeline ?? fallback;
  return setTimelineCommand(document, updater(current));
}

/** Edit an animated property at an exact playhead time. Static properties remain static. */
export function setAnimatedPropertyAtTime(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): TimelineCommandResult {
  const timeline = document.timeline;
  if (!timeline) return { document };
  const t = Math.max(0, time);
  const existingTrack = timeline.tracks.find(track => track.layerId === layerId && track.property === property);
  if (!existingTrack) return { document };
  const existingKeyframe = existingTrack.keyframes.find(keyframe => Math.abs(keyframe.time - t) <= 0.0001);
  if (existingKeyframe) {
    if (Object.is(existingKeyframe.value, value)) return { document };
    const after = { ...existingKeyframe, value };
    const nextTrack = { ...existingTrack, keyframes: existingTrack.keyframes.map(keyframe => keyframe.id === existingKeyframe.id ? after : keyframe) };
    const nextTimeline = { ...timeline, tracks: timeline.tracks.map(track => track.id === existingTrack.id ? nextTrack : track) };
    return { document: { ...document, timeline: nextTimeline }, operation: { type: "update-keyframe", trackId: existingTrack.id, keyframeId: existingKeyframe.id, fromValue: existingKeyframe.value, toValue: value } };
  }
  const keyframe = createKeyframe(t, value);
  const nextTrack = upsertKeyframe(existingTrack, keyframe);
  const nextTimeline = { ...timeline, tracks: timeline.tracks.map(track => track.id === existingTrack.id ? nextTrack : track) };
  return { document: { ...document, timeline: nextTimeline }, operation: { type: "add-keyframe", track: existingTrack, keyframe } };
}

export function createAnimatedPropertyCommand(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): TimelineCommandResult {
  const timeline = document.timeline;
  if (!timeline) return { document };
  const track = createTrack(layerId, property);
  const keyframe = createKeyframe(Math.max(0, time), value);
  const nextTimeline = { ...timeline, tracks: [...timeline.tracks, track.keyframes.length ? track : { ...track, keyframes: [keyframe] }] };
  return { document: { ...document, timeline: nextTimeline }, operation: { type: "add-keyframe", track, keyframe } };
}
