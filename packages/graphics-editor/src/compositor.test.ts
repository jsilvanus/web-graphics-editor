import { describe, expect, it } from "vitest";
import { composeDocumentAtTime, composeOutput } from "./compositor";
import type { GraphicsDocument } from "./types";

const document: GraphicsDocument = {
  width: 1920,
  height: 1080,
  layers: [{ id: "title", type: "text", x: 10, y: 20, width: 300, height: 80, text: "Hello" }],
  compositions: [{ id: "main", name: "Main", layerIds: ["title"], duration: 10 }],
};

describe("compositor", () => {
  it("produces one render frame from a composition", () => {
    const frame = composeDocumentAtTime(document, 2);
    expect(frame?.kind).toBe("composition");
    expect(frame?.compositionId).toBe("main");
    expect(frame?.time).toBe(2);
    expect(frame?.layers.map(layer => layer.id)).toEqual(["title"]);
    expect(frame?.renderTree.map(node => node.layer.id)).toEqual(["title"]);
  });

  it("uses the same evaluated frame for output selection", () => {
    const output = {
      id: "program",
      name: "Program",
      viewportId: "main",
      playback: "static",
    } as const;
    const withViewport = {
      ...document,
      viewports: [{ id: "main", width: 1920, height: 1080, compositionIds: ["main"] }],
    };
    const frame = composeDocumentAtTime(withViewport, 3, "main");
    const outputFrame = composeOutput(withViewport, output, 3);
    expect(outputFrame?.compositionId).toBe(frame?.compositionId);
    expect(outputFrame?.time).toBe(frame?.time);
    expect(outputFrame?.renderTree).toEqual(frame?.renderTree);
  });
});
