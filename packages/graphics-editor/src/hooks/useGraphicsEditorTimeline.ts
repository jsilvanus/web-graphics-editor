import { useCallback, useState } from "react";
import { timelineDuration } from "../timeline";
import type { GraphicsDocument, Graphics3DWorld, SceneTimeline, Graphics3DWorldTimeline } from "../types";
import { setTimelineCommand } from "../document/timelineCommands";
import type { DocumentOperation } from "../history/operations";

export type TimelineContext = { kind: "main" } | { kind: "world"; worldId: string };

export function createDefaultTimeline(): SceneTimeline { const scene = { id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "Scene 1", start: 0, duration: 10 }; return { scenes: [scene], currentSceneId: scene.id, currentTime: 0, tracks: [], clips: [] }; }
export function createDefaultWorldTimeline(): Graphics3DWorldTimeline { return { duration: 10, tracks: [], loop: false }; }

type ExecuteCommand = (command: { document: GraphicsDocument; operation?: DocumentOperation }, options?: { label?: string }) => GraphicsDocument | undefined;

export function useGraphicsEditorTimeline(document: GraphicsDocument, executeCommand: ExecuteCommand) {
  const [context, setContext] = useState<TimelineContext>({ kind: "main" });
  const mainTimeline = document.timeline ?? createDefaultTimeline();
  const world = context.kind === "world" ? document.worlds3d?.find(w => w.id === context.worldId) : undefined;
  const timeline = context.kind === "main" ? mainTimeline : (world?.timeline ?? createDefaultWorldTimeline());

  const enterWorld = useCallback((worldId: string) => setContext({ kind: "world", worldId }), []);
  const exitWorld = useCallback(() => setContext({ kind: "main" }), []);

  const seek = useCallback((time: number) => {
    if (context.kind === "main") {
      const next = { ...mainTimeline, currentTime: Math.max(0, Math.min(timelineDuration(mainTimeline), time)) };
      executeCommand({ document: { ...document, timeline: next } }, { label: "Seek" });
      return;
    }
    const wt = timeline as Graphics3DWorldTimeline;
    const max = wt.duration ?? timelineDuration({ scenes: [], currentSceneId: "", currentTime: 0, tracks: [] });
    const nextWorld: Graphics3DWorld = { ...world!, timeline: { ...wt, currentTime: Math.max(0, Math.min(max, time)) } as Graphics3DWorldTimeline };
    executeCommand({ document: { ...document, worlds3d: (document.worlds3d ?? []).map(w => w.id === context.worldId ? nextWorld : w) } }, { label: "Seek world" });
  }, [context, document, executeCommand, mainTimeline, timeline, world]);

  const changeTimeline = useCallback((next: SceneTimeline) => {
    if (context.kind === "main") executeCommand(setTimelineCommand(document, next), { label: "Update timeline" });
    else executeCommand({ document: { ...document, worlds3d: (document.worlds3d ?? []).map(w => w.id === context.worldId ? { ...w, timeline: next as unknown as Graphics3DWorldTimeline } : w) } }, { label: "Update world timeline" });
  }, [context, document, executeCommand]);
  const setTimeline = changeTimeline;
  return { timeline: timeline as SceneTimeline, setTimeline, seek, changeTimeline, context, enterWorld, exitWorld };
}
