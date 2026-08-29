import { describe, expect, it } from "vitest";
import { resolveComposition, resolveOutput, resolveScene, resolveViewportComposition, sceneAtTime } from "./presentation";
import type { GraphicsDocument } from "./types";

const document: GraphicsDocument = {
  width: 1920, height: 1080,
  layers: [
    { id: "bg", type: "rectangle", x: 0, y: 0, width: 1920, height: 1080 },
    { id: "name", type: "text", x: 100, y: 900, width: 600, height: 100, text: "Name", viewportOverrides: { venue: { visible: false }, broadcast: { x: 120, y: 850 } } },
    { id: "lyrics", type: "text", x: 100, y: 700, width: 1000, height: 100, text: "Lyrics", viewportOverrides: { broadcast: { visible: false } } },
  ],
  compositions: [
    { id: "event", name: "Event", layerIds: ["bg", "name", "lyrics"] },
    { id: "minimal", name: "Minimal", layerIds: ["bg", "name"] },
  ],
  viewports: [
    { id: "broadcast", name: "Broadcast", width: 1920, height: 1080, compositionIds: ["event"] },
    { id: "venue", name: "Venue", width: 1080, height: 1920, compositionIds: ["event"] },
  ],
  timeline: {
    scenes: [
      { id: "intro", name: "Intro", compositionId: "minimal", start: 0, duration: 5 },
      { id: "event", name: "Event", compositionId: "event", start: 5, duration: 10 },
    ], currentSceneId: "intro", currentTime: 0, tracks: [], loop: true,
  },
  outputs: [{ id: "broadcast-out", name: "Broadcast", viewportId: "broadcast", playback: "live", background: "transparent" }],
};

describe("presentation resolution", () => {
  it("preserves composition layer order", () => {
    expect(resolveComposition(document, "event")?.layers.map(l => l.id)).toEqual(["bg", "name", "lyrics"]);
  });

  it("applies viewport overrides without mutating source layers", () => {
    const result = resolveViewportComposition(document, "venue", "event");
    expect(result?.layers.find(l => l.id === "name")?.visible).toBe(false);
    expect(result?.layers.find(l => l.id === "name")?.x).toBe(100);
    expect(document.layers.find(l => l.id === "name")?.visible).toBeUndefined();
  });

  it("selects the viewport's default composition", () => {
    expect(resolveViewportComposition(document, "broadcast")?.composition.id).toBe("event");
  });

  it("resolves scenes using timeline time and loops", () => {
    expect(sceneAtTime(document.timeline, 2)?.id).toBe("intro");
    expect(sceneAtTime(document.timeline, 6)?.id).toBe("event");
    expect(sceneAtTime(document.timeline, 16)?.id).toBe("intro");
  });

  it("resolves scene-local time", () => {
    const result = resolveScene(document, 7, "broadcast");
    expect(result?.scene.id).toBe("event");
    expect(result?.localTime).toBe(2);
    expect(result?.composition.id).toBe("event");
  });

  it("resolves an output through its viewport and active scene", () => {
    const result = resolveOutput(document, "broadcast-out", 7);
    expect(result && "scene" in result ? result.scene.id : undefined).toBe("event");
    expect(result && "layers" in result ? result.layers.map(l => l.id) : []).toEqual(["bg", "name", "lyrics"]);
  });
});
