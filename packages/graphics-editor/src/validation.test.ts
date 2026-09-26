import { describe, expect, it } from "vitest";
import { validateGraphicsDocument } from "./validation";
import { deserializeGraphicsDocument, serializeGraphicsDocument } from "./serialization";
import type { GraphicsDocument } from "./types";

const document = (): GraphicsDocument => ({
  width: 100,
  height: 100,
  layers: [{ id: "a", type: "rectangle", x: 0, y: 0, width: 20, height: 20 }],
});

describe("graphics document robustness", () => {
  it("rejects duplicate and dangling layer references", () => {
    const result = validateGraphicsDocument({
      ...document(),
      layers: [
        ...document().layers,
        { ...document().layers[0], id: "a" },
        { ...document().layers[0], id: "b", parentId: "missing" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Duplicate layer id");
    expect(result.errors.join(" ")).toContain("missing parent");
  });

  it("rejects parent cycles", () => {
    const result = validateGraphicsDocument({
      ...document(),
      layers: [
        { ...document().layers[0], id: "a", parentId: "b" },
        { ...document().layers[0], id: "b", parentId: "a" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("cycle");
  });

  it("round-trips a valid document", () => {
    expect(deserializeGraphicsDocument(serializeGraphicsDocument(document()))).toEqual(document());
  });
});
