import { useCallback, useState } from "react";
import { timelineDuration } from "../timeline";
import type { GraphicsDocument, Graphics3DWorldTimeline, SceneTimeline } from "../types";
import { setTimelineCommand } from "../document/timelineCommands";
import type { DocumentOperation } from "../history/operations";

export type TimelineContext = { kind: "main" } | { kind: "world"; worldId: string };

type ExecuteCommand = (command: { document: GraphicsDocument; operation?: DocumentOperation }, options?: { label?: string }) => GraphicsDocument | undefined;
export function createDefaultTimeline(): SceneTimeline { const scene = { id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "Scene 1", start: 0, duration: 10 }; return { scenes: [scene], currentSceneId: scene.id, currentTime: 0, tracks: [], clips: [] }; }
export function createDefaultWorldTimeline(): Graphics3DWorldTimeline { return { duration: 10, tracks: [], loop: false }; }

export function useGraphicsEditorTimeline(document: GraphicsDocument, executeCommand: ExecuteCommand) {
  const [context, setContext] = useState<TimelineContext>({ kind: "main" });
  const [worldCurrentTime, setWorldCurrentTime] = useState(0);
  const mainTimeline = document.timeline ?? createDefaultTimeline();
  const world = context.kind === "world" ? document.worlds3d?.find(w => w.id === context.worldId) : undefined;
  const worldTimeline = world?.timeline ?? createDefaultWorldTimeline();

  const enterWorld = useCallback((worldId: string) => { setContext({ kind: "world", worldId }); setWorldCurrentTime(0); }, []);
  const exitWorld = useCallback(() => setContext({ kind: "main" }), []);
  const seek = useCallback((time: number) => {
    if (context.kind === "world") { const max = worldTimeline.duration ?? 0; setWorldCurrentTime(Math.max(0, Math.min(max, time))); return; }
    const next = { ...mainTimeline, currentTime: Math.max(0, Math.min(timelineDuration(mainTimeline), time)) };
    executeCommand({ document: { ...document, timeline: next } }, { label: "Seek" });
  }, [context, document, executeCommand, mainTimeline, worldTimeline]);
  const changeTimeline = useCallback((next: SceneTimeline) => {
    if (context.kind === "main") executeCommand(setTimelineCommand(document, next), { label: "Update timeline" });
  }, [context, document, executeCommand]);
  const updateWorldTimeline = useCallback((next: Graphics3DWorldTimeline) => {
    if (context.kind !== "world") return;
    executeCommand({ document: { ...document, worlds3d: (document.worlds3d ?? []).map(w => w.id === context.worldId ? { ...w, timeline: next } : w) } }, { label: "Update world timeline" });
  }, [context, document, executeCommand]);
  return { timeline: mainTimeline, worldTimeline, world, worldCurrentTime, setTimeline: changeTimeline, seek, changeTimeline, context, enterWorld, exitWorld, updateWorldTimeline };
}
