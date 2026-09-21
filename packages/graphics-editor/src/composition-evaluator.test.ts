import { describe, expect, it } from "vitest";
import { evaluateComposition, evaluateScene } from "./composition-evaluator";
import type { GraphicsDocument } from "./types";

const document: GraphicsDocument = {
  width: 1920,
  height: 1080,
  layers: [
    { id: "bg", type: "rectangle", x: 0, y: 0, width: 1920, height: 1080 },
    {
      id: "group",
      type: "group",
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      children: ["title"],
    },
    { id: "title", type: "text", x: 100, y: 100, width: 600, height: 100, text: "Hello", parentId: "group" },
  ],
  compositions: [
    { id: "main", name: "Main", layerIds: ["bg", "group", "title"], duration: 5, loop: true },
  ],
  timeline: {
    scenes: [
      { id: "intro", name: "Intro", compositionId: "main", start: 0, duration: 10 },
    ],
    currentSceneId: "intro",
    currentTime: 0,
    tracks: [],
  },
};

describe("composition evaluation boundary", () => {
  it("evaluates a composition into a renderer-ready snapshot", () => {
    const result = evaluateComposition(document, "main", 2.5);

    expect(result?.kind).toBe("composition");
    expect(result?.time).toBe(2.5);
    expect(result?.composition.id).toBe("main");
    expect(result?.layers.map(layer => layer.id)).toEqual(["bg", "group", "title"]);
    expect(result?.renderTree.map(node => node.layer.id)).toEqual(["bg", "group"]);
    expect(result?.renderTree[1]?.children.map(node => node.layer.id)).toEqual(["title"]);
  });

  it("clamps invalid composition times without mutating the document", () => {
    const result = evaluateComposition(document, "main", -5);
    expect(result?.time).toBe(0);
    expect(document.timeline?.currentTime).toBe(0);

    expect(evaluateComposition(document, "main", Number.NaN)?.time).toBe(0);
  });

  it("evaluates composition-local duration and looping", () => {
    expect(evaluateComposition(document, "main", 7)?.time).toBe(2);
    expect(evaluateComposition(document, "main", 5)?.time).toBe(0);
  });

  it("returns undefined for an unknown composition", () => {
    expect(evaluateComposition(document, "missing", 1)).toBeUndefined();
  });

  it("evaluates a scene using global and local time", () => {
    const result = evaluateScene(document, 3);

    expect(result?.kind).toBe("scene");
    expect(result?.globalTime).toBe(3);
    expect(result?.localTime).toBe(3);
    expect(result?.time).toBe(3);
    expect(result?.composition.id).toBe("main");
    expect(result?.scene.id).toBe("intro");
  });

  it("keeps evaluation separate from the persistent document", () => {
    const result = evaluateComposition(document, "main", 4);
    expect(result).toBeDefined();
    expect(result?.layers).not.toBe(document.layers);
    expect(result?.composition).not.toBe(document.compositions?.[0]);
    expect(result?.layers[0]).not.toBe(document.layers[0]);
  });
});
