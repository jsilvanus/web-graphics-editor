import { useCallback } from "react";
import { timelineDuration } from "../timeline";
import type { GraphicsDocument, SceneTimeline } from "../types";
import { setTimelineCommand } from "../document/timelineCommands";
import type { DocumentOperation } from "../history/operations";

export function createDefaultTimeline(): SceneTimeline { const scene = { id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "Scene 1", start: 0, duration: 10 }; return { scenes: [scene], currentSceneId: scene.id, currentTime: 0, tracks: [], clips: [] }; }

type ExecuteCommand = (command: { document: GraphicsDocument; operation?: DocumentOperation }, options?: { label?: string }) => GraphicsDocument | undefined;

export function useGraphicsEditorTimeline(document: GraphicsDocument, executeCommand: ExecuteCommand) {
  const timeline = document.timeline;
  const seek = useCallback((time: number) => {
    if (!timeline) return;
    const next = { ...timeline, currentTime: Math.max(0, Math.min(timelineDuration(timeline), time)) };
    // Seeking is playback/editor state, not an undoable document edit.
    executeCommand({ document: { ...document, timeline: next } }, { label: "Seek" });
  }, [document, timeline, executeCommand]);
  const changeTimeline = useCallback((next: SceneTimeline) => {
    executeCommand(setTimelineCommand(document, next), { label: "Update timeline" });
  }, [document, executeCommand]);
  const setTimeline = changeTimeline;
  return { timeline: timeline ?? createDefaultTimeline(), setTimeline, seek, changeTimeline };
}
