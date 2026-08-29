import type { GraphicsDocument, SceneTimeline } from "../types";
import type { DocumentOperation } from "../history/operations";

export interface TimelineCommandResult { document: GraphicsDocument; operation?: DocumentOperation }

export function setTimelineCommand(document: GraphicsDocument, timeline: SceneTimeline | undefined): TimelineCommandResult {
  if (JSON.stringify(document.timeline) === JSON.stringify(timeline)) return { document };
  return { document: { ...document, timeline }, operation: { type: "set-timeline", from: document.timeline, to: timeline } };
}

export function updateTimelineCommand(document: GraphicsDocument, updater: (timeline: SceneTimeline) => SceneTimeline, fallback: SceneTimeline): TimelineCommandResult {
  const current = document.timeline ?? fallback;
  return setTimelineCommand(document, updater(current));
}
