import type { AnimationValue, GraphicsDocument, Keyframe, Track, AnimatedProperty, AnimationTrack } from "../types";
import { createKeyframe, createTrack, upsertKeyframe } from "../timeline";
import type { DocumentOperation } from "../history/operations";

export interface AnimationCommandResult { document: GraphicsDocument; operation?: DocumentOperation }

export function setAnimatedPropertyAtTime(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): AnimationCommandResult {
  const timeline = document.timeline;
  if (!timeline) return { document };
  const track = timeline.tracks.find(item => item.layerId === layerId && item.property === property);
  const existing = track?.keyframes.find(keyframe => Math.abs(keyframe.time - time) < 0.0001);
  if (existing && track) {
    if (existing.value === value) return { document };
    const operation: DocumentOperation = { type: "update-keyframe", trackId: track.id, keyframeId: existing.id, fromValue: existing.value, toValue: value };
    return { document: { ...document, timeline: { ...timeline, tracks: timeline.tracks.map(item => item.id === track.id ? upsertKeyframe(item, { ...existing, value }) : item) } }, operation };
  }
  const nextTrack = track ?? createTrack(layerId, property);
  const keyframe = createKeyframe(Math.max(0, time), value);
  const nextTimeline = track
    ? { ...timeline, tracks: timeline.tracks.map(item => item.id === track.id ? upsertKeyframe(item, keyframe) : item) }
    : { ...timeline, tracks: [...timeline.tracks, upsertKeyframe(nextTrack, keyframe)] };
  return { document: { ...document, timeline: nextTimeline }, operation: { type: "add-keyframe", track: nextTrack, keyframe } };
}

export function enableAnimatedProperty(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): AnimationCommandResult {
  const timeline = document.timeline;
  if (!timeline) return { document };
  const track = timeline.tracks.find(item => item.layerId === layerId && item.property === property);
  if (track) return setAnimatedPropertyAtTime(document, layerId, property, time, value);
  return setAnimatedPropertyAtTime(document, layerId, property, time, value);
}


export function setCompositionAnimatedPropertyAtTime(
  document: GraphicsDocument,
  compositionId: string,
  layerId: string,
  property: string,
  time: number,
  value: AnimationValue,
): GraphicsDocument {
  const composition = document.compositions?.find(item => item.id === compositionId);
  if (!composition || !composition.layerIds.includes(layerId)) return document;

  const timeline = composition.timeline ?? { tracks: [] };
  const track = timeline.tracks.find(item => item.targetId === layerId && item.property === property);
  const keyframe = {
    id: track?.keyframes.find(item => Math.abs(item.time - time) < 0.0001)?.id ?? `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: Math.max(0, time),
    value,
  };
  const nextTrack: AnimationTrack = track
    ? { ...track, keyframes: [...track.keyframes.filter(item => item.id !== keyframe.id && Math.abs(item.time - keyframe.time) > 0.0001), keyframe].sort((a, b) => a.time - b.time) }
    : { id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, targetId: layerId, property, keyframes: [keyframe] };

  return {
    ...document,
    compositions: document.compositions?.map(item => item.id === compositionId
      ? { ...item, timeline: { ...timeline, tracks: track ? timeline.tracks.map(existing => existing.id === track.id ? nextTrack : existing) : [...timeline.tracks, nextTrack] } }
      : item),
  };
}
