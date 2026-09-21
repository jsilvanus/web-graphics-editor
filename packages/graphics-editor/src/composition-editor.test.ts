import { describe, expect, it } from "vitest";
import { enterCompositionPath, exitCompositionPath, compositionPathNames } from "./composition-navigation";
import type { Composition, GraphicsDocument } from "./types";
import { evaluateComposition } from "./composition-evaluator";

describe("composition editor navigation", () => {
  it("enters nested compositions and truncates an existing branch", () => {
    expect(enterCompositionPath([], "main")).toEqual(["main"]);
    expect(enterCompositionPath(["main"], "intro")).toEqual(["main", "intro"]);
    expect(enterCompositionPath(["main", "intro"], "main")).toEqual(["main"]);
  });
  it("exits one composition level", () => {
    expect(exitCompositionPath(["main", "intro", "logo"])).toEqual(["main", "intro"]);
    expect(exitCompositionPath(["main"])).toEqual([]);
  });
  it("resolves breadcrumb names without breaking missing references", () => {
    const compositions: Composition[] = [{ id: "main", name: "Main", layerIds: [] }];
    expect(compositionPathNames(compositions, ["main", "missing"])).toEqual(["Main", "missing"]);
  });
});

describe("composition video evaluation", () => {
  it("maps a video layer to media time while evaluating a composition", () => {
    const document: GraphicsDocument = {
      width: 1920, height: 1080,
      layers: [{ id: "video", type: "video", x: 0, y: 0, width: 1920, height: 1080, videoAssetId: "asset", timeOffset: 1, playbackRate: 2, sourceIn: 5 }],
      assets: [{ id: "asset", type: "video", name: "clip", url: "clip.mp4" }],
      compositions: [{ id: "main", name: "Main", layerIds: ["video"], duration: 20 }],
    };
    const evaluation = evaluateComposition(document, "main", 4);
    expect(evaluation?.videos).toEqual([expect.objectContaining({ layerId: "video", assetId: "asset", mediaTime: 11 })]);
  });
  it("seeks a looping video within its source range", () => {
    const document: GraphicsDocument = {
      width: 100, height: 100,
      layers: [{ id: "video", type: "video", x: 0, y: 0, width: 100, height: 100, videoAssetId: "asset", sourceIn: 10, sourceOut: 12, loop: true }],
      assets: [{ id: "asset", type: "video", name: "clip", url: "clip.mp4" }],
      compositions: [{ id: "main", name: "Main", layerIds: ["video"], duration: 20 }],
    };
    const evaluation = evaluateComposition(document, "main", 5);
    expect(evaluation?.videos[0].mediaTime).toBe(11);
  });

  it("maps nested composition time with offset, rate, source range, and loop", () => {
    const document: GraphicsDocument = {
      width: 100, height: 100,
      layers: [{ id: "instance", type: "composition", x: 0, y: 0, width: 100, height: 100, compositionId: "child", timeOffset: 2, playbackRate: 2, compositionIn: 3, compositionOut: 7, loop: true }],
      compositions: [
        { id: "parent", name: "Parent", layerIds: ["instance"], duration: 20 },
        { id: "child", name: "Child", layerIds: ["child-layer"], duration: 10 },
      ],
    };
    const childLayer = { id: "child-layer", type: "rectangle" as const, x: 0, y: 0, width: 10, height: 10 };
    const withChild = { ...document, layers: [document.layers[0], childLayer] };
    const atOffset = evaluateComposition(withChild, "parent", 2);
    expect(atOffset?.renderTree[0]?.children[0]?.layer.id).toBe("child-layer");
    const before = evaluateComposition(withChild, "parent", 1.9);
    expect(before?.renderTree[0]?.opacity).toBe(0);
    const looped = evaluateComposition(withChild, "parent", 4.5);
    expect(looped?.renderTree[0]?.children[0]?.layer.id).toBe("child-layer");
    const after = evaluateComposition(withChild, "parent", 6);
    expect(after?.renderTree[0]?.children[0]?.layer.id).toBe("child-layer");
  });

  it("keeps nested composition instances inactive before their offset and after their out point", () => {
    const document: GraphicsDocument = {
      width: 100, height: 100,
      layers: [{ id: "instance", type: "composition", x: 0, y: 0, width: 100, height: 100, compositionId: "child", timeOffset: 2, compositionIn: 1, compositionOut: 4 }],
      compositions: [{ id: "child", name: "Child", layerIds: [], duration: 10 }],
    };
    const before = evaluateComposition(document, "child", 0);
    expect(before?.time).toBe(0);
    const parent: GraphicsDocument = {
      ...document,
      compositions: [
        { id: "parent", name: "Parent", layerIds: ["instance"], duration: 10 },
        ...(document.compositions ?? []),
      ],
    };
    const beforeParent = evaluateComposition(parent, "parent", 1);
    expect(beforeParent?.renderTree[0]?.opacity).toBe(0);
    const activeParent = evaluateComposition(parent, "parent", 3);
    expect(activeParent?.renderTree[0]?.children).toEqual([]);
    const afterParent = evaluateComposition(parent, "parent", 6);
    expect(afterParent?.renderTree[0]?.opacity).toBe(0);
  });
});
