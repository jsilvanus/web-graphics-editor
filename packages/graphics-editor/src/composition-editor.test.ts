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
});
