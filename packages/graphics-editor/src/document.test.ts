import { describe, expect, it } from "vitest";
import { documentsEqual, updateLayer, updateLayerStyle } from "./document";
import type { GraphicsDocument } from "./types";

const doc: GraphicsDocument = { width: 1920, height: 1080, layers: [{ id: "a", type: "text", x: 1, y: 2, width: 100, height: 50, text: "Hello", style: { color: "white" } }] };

describe("document operations", () => {
  it("updates only the requested layer", () => {
    const next = updateLayer(doc, "a", { x: 10 });
    expect(next.layers[0]).toMatchObject({ x: 10, y: 2, text: "Hello" });
    expect(next).not.toBe(doc);
  });

  it("updates a layer style without replacing other style values", () => {
    const next = updateLayerStyle(doc, "a", "font-size", "48px");
    expect(next.layers[0].style).toEqual({ color: "white", "font-size": "48px" });
  });

  it("distinguishes equal documents", () => {
    expect(documentsEqual(doc, { ...doc, layers: [...doc.layers] })).toBe(true);
    expect(documentsEqual(doc, updateLayer(doc, "a", { x: 99 }))).toBe(false);
  });
});
