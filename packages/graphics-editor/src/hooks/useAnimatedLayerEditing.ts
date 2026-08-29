import { useCallback } from "react";
import type { GraphicsDocument, Layer, SceneTimeline } from "../types";
import type { AnimatedProperty } from "../timeline";
import { createKeyframe, createTrack, upsertKeyframe } from "../timeline";
import { updateLayerCommand, updateLayerStyleCommand } from "../document/commands";
import { setTimelineCommand } from "../document/timelineCommands";
import type { DocumentOperation } from "../history/operations";

export const ANIMATED_PROPERTIES: AnimatedProperty[] = ["x", "y", "width", "height", "rotation", "opacity"];
type ExecuteCommand = (command: { document: GraphicsDocument; operation?: DocumentOperation }, options?: { label?: string }) => GraphicsDocument | undefined;

export function useAnimatedLayerEditing(document: GraphicsDocument, executeCommand: ExecuteCommand, currentTime: number) {
  const ensureTrackAndKey = useCallback((id: string, property: AnimatedProperty, value: number) => {
    const timeline = document.timeline;
    if (!timeline) return;
    const existing = timeline.tracks.find(track => track.layerId === id && track.property === property);
    const track = existing ?? createTrack(id, property);
    const nextTrack = upsertKeyframe(track, createKeyframe(currentTime, value));
    const nextTimeline: SceneTimeline = existing
      ? { ...timeline, tracks: timeline.tracks.map(item => item.id === track.id ? nextTrack : item) }
      : { ...timeline, tracks: [...timeline.tracks, nextTrack] };
    executeCommand(setTimelineCommand(document, nextTimeline), { label: `Keyframe ${property}` });
  }, [document, currentTime, executeCommand]);

  const changeLayer = useCallback((id: string, patch: Partial<Layer>) => {
    const result = updateLayerCommand(document, id, patch);
    if (result.operation) executeCommand(result, { label: "Update animated layer" });
    for (const [property, value] of Object.entries(patch)) {
      if (!ANIMATED_PROPERTIES.includes(property as AnimatedProperty)) continue;
      const n = Number(value);
      if (Number.isFinite(n)) ensureTrackAndKey(id, property as AnimatedProperty, n);
    }
  }, [document, executeCommand, ensureTrackAndKey]);

  const changeStyle = useCallback((id: string, key: string, value: string | number) => {
    const result = updateLayerStyleCommand(document, id, key, value);
    if (result.operation) executeCommand(result, { label: `Set ${key}` });
    if (key === "opacity") {
      const n = Number(value);
      if (Number.isFinite(n)) ensureTrackAndKey(id, "opacity", n);
    }
  }, [document, executeCommand, ensureTrackAndKey]);

  return { changeLayer, changeStyle, ensureTrackAndKey };
}
