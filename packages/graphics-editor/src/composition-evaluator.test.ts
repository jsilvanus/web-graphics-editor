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

  it("evaluates composition-local animation tracks", () => {
    const animated = {
      ...document,
      compositions: [{
        id: "main",
        name: "Main",
        layerIds: ["bg", "group", "title"],
        duration: 5,
        timeline: {
          tracks: [{
            id: "track-x",
            targetId: "title",
            property: "x",
            keyframes: [
              { id: "k0", time: 0, value: 10 },
              { id: "k1", time: 4, value: 110 },
            ],
          }, {
            id: "track-opacity",
            targetId: "title",
            property: "opacity",
            keyframes: [
              { id: "o0", time: 0, value: 0 },
              { id: "o1", time: 2, value: 1 },
            ],
          }],
        },
      }],
    };
    const result = evaluateComposition(animated, "main", 1);
    const title = result?.layers.find(layer => layer.id === "title");
    expect(title?.x).toBe(35);
    expect(title?.opacity).toBe(0.5);
  });

  it("does not mutate the document while evaluating animation", () => {
    const original = document.layers.find(layer => layer.id === "title")!;
    const animated = {
      ...document,
      compositions: [{
        id: "main",
        name: "Main",
        layerIds: ["title"],
        timeline: {
          tracks: [{
            id: "track",
            targetId: "title",
            property: "style.color",
            keyframes: [
              { id: "a", time: 0, value: "#000000" },
              { id: "b", time: 1, value: "#ffffff" },
            ],
          }],
        },
      }],
    };
    const result = evaluateComposition(animated, "main", 0.5);
    expect(result?.layers[0].style?.color).toBe("#808080ff");
    expect(original.style?.color).toBeUndefined();
  });
});
