import { describe, expect, it } from "vitest";
import { deserializeGraphicsDocument, serializeGraphicsDocument } from "./serialization";
import type { GraphicsDocument } from "./types";

const document: GraphicsDocument = {
  width: 1920,
  height: 1080,
  background: "#111",
  layers: [{ id: "box", type: "rectangle", x: 10, y: 20, width: 100, height: 80, style: { background: "#fff" } }],
};

describe("graphics document serialization", () => {
  it("round-trips a document", () => {
    expect(deserializeGraphicsDocument(serializeGraphicsDocument(document))).toEqual(document);
  });

  it("normalizes Saarnavideo rect layers", () => {
    const legacy = JSON.stringify({ width: 1920, height: 1080, layers: [{ id: "box", type: "rect", x: 0, y: 0, width: 10, height: 10 }] });
    expect(deserializeGraphicsDocument(legacy).layers[0].type).toBe("rectangle");
  });
});
