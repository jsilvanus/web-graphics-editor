import { describe, expect, it } from "vitest";
import type { GraphicsDocument, SceneTimeline, Track } from "../types";
import { applyOperation, invertOperation } from "../history/operations";
import { setTimelineCommand } from "./timelineCommands";

const timeline = (track: Track): SceneTimeline => ({ scenes: [{ id: "s", name: "Scene", start: 0, duration: 10 }], currentSceneId: "s", currentTime: 3.25, tracks: [track], clips: [{ id: "c", layerId: "l", start: 1, duration: 4 }] });
const track: Track = { id: "t", layerId: "l", property: "x", keyframes: [{ id: "k1", time: 0, value: 100 }, { id: "k2", time: 5, value: 500 }] };
const doc = (t = timeline(track)): GraphicsDocument => ({ width: 1920, height: 1080, layers: [{ id: "l", type: "rectangle", x: 100, y: 0, width: 100, height: 100 }], timeline: t });

describe("timeline operations", () => {
  it("creates a keyframe at the exact playhead time", () => {
    const d = doc();
    const k = { id: "k3", time: 3.25, value: 325 };
    const op = { type: "add-keyframe" as const, track, keyframe: k };
    const after = applyOperation(d, op);
    expect(after.timeline?.tracks[0].keyframes).toContainEqual(k);
    expect(after.timeline?.tracks[0].keyframes.map(x => x.time)).toEqual([0, 3.25, 5]);
  });

  it("updates an existing keyframe without creating another", () => {
    const d = doc({ ...timeline(track), currentTime: 5 });
    const op = { type: "update-keyframe" as const, trackId: "t", keyframeId: "k2", fromValue: 500, toValue: 700 };
    const after = applyOperation(d, op);
    expect(after.timeline?.tracks[0].keyframes).toHaveLength(2);
    expect(after.timeline?.tracks[0].keyframes.find(k => k.id === "k2")?.value).toBe(700);
  });

  it("moves and deletes keyframes reversibly", () => {
    const d = doc();
    const move = { type: "move-keyframe" as const, trackId: "t", keyframeId: "k1", fromTime: 0, toTime: 2 };
    const moved = applyOperation(d, move);
    expect(moved.timeline?.tracks[0].keyframes[0].time).toBe(2);
    expect(applyOperation(moved, move, true)).toEqual(d);
    const deleted = { type: "delete-keyframe" as const, track, keyframe: track.keyframes[0] };
    const afterDelete = applyOperation(d, deleted);
    expect(afterDelete.timeline?.tracks[0].keyframes.map(k => k.id)).toEqual(["k2"]);
    expect(applyOperation(afterDelete, deleted, true)).toEqual(d);
    expect(applyOperation(d, invertOperation(deleted))).toEqual(afterDelete);
  });

  it("changes clip timing without changing layer order", () => {
    const d = doc();
    const op = { type: "set-clip-timing" as const, clipId: "c", from: { start: 1, duration: 4 }, to: { start: 2, duration: 3 } };
    const after = applyOperation(d, op);
    expect(after.timeline?.clips?.[0]).toMatchObject({ start: 2, duration: 3 });
    expect(after.layers).toEqual(d.layers);
    expect(applyOperation(after, op, true)).toEqual(d);
  });

  it("keeps timeline edits undoable as one operation", () => {
    const d = doc();
    const next = { ...d.timeline!, currentTime: 3.25 };
    const result = setTimelineCommand(d, next);
    expect(result.operation?.type).toBe("set-timeline");
    expect(applyOperation(d, result.operation!)).toEqual(result.document);
    expect(applyOperation(result.document, result.operation!, true)).toEqual(d);
  });
});
