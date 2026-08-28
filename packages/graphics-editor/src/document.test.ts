import { describe, expect, it } from "vitest";
import { bringLayerForward, bringLayerToFront, documentsEqual, getLayerTreeIds, moveLayersByDelta, sendLayerBackward, sendLayerToBack, updateLayer, updateLayerStyle } from "./document";
import type { GraphicsDocument } from "./types";

const doc: GraphicsDocument = { width: 1920, height: 1080, layers: [
  { id: "a", type: "rectangle", x: 0, y: 0, width: 10, height: 10 },
  { id: "b", type: "rectangle", x: 0, y: 0, width: 10, height: 10 },
  { id: "c", type: "rectangle", x: 0, y: 0, width: 10, height: 10 },
  { id: "d", type: "rectangle", x: 0, y: 0, width: 10, height: 10 },
] };
const ids = (value: GraphicsDocument) => value.layers.map(layer => layer.id);

describe("document operations", () => {
  it("updates only the requested layer", () => {
    const next = updateLayer(doc, "a", { x: 10 });
    expect(next.layers[0]).toMatchObject({ x: 10, y: 0 });
    expect(next).not.toBe(doc);
  });

  it("updates a layer style without replacing other style values", () => {
    const next = updateLayerStyle({ ...doc, layers: [{ ...doc.layers[0], style: { color: "white" } }] }, "a", "font-size", "48px");
    expect(next.layers[0].style).toEqual({ color: "white", "font-size": "48px" });
  });

  it("distinguishes equal documents", () => {
    expect(documentsEqual(doc, { ...doc, layers: [...doc.layers] })).toBe(true);
    expect(documentsEqual(doc, updateLayer(doc, "a", { x: 99 }))).toBe(false);
  });

  it("moves a layer one step forward", () => expect(ids(bringLayerForward(doc, "b"))).toEqual(["a", "c", "b", "d"]));
  it("moves a layer one step backward", () => expect(ids(sendLayerBackward(doc, "c"))).toEqual(["a", "c", "b", "d"]));
  it("moves a layer to the front", () => expect(ids(bringLayerToFront(doc, "b"))).toEqual(["a", "c", "d", "b"]));
  it("moves a layer to the back", () => expect(ids(sendLayerToBack(doc, "c"))).toEqual(["c", "a", "b", "d"]));
  it("keeps edge and unknown layers unchanged", () => {
    expect(bringLayerForward(doc, "d")).toBe(doc);
    expect(sendLayerBackward(doc, "a")).toBe(doc);
    expect(bringLayerForward(doc, "missing")).toBe(doc);
  });

  it("finds all descendants of a group recursively", () => {
    const nested: GraphicsDocument = { ...doc, layers: [
      { id: "group", type: "group", x: 10, y: 20, width: 100, height: 100, children: ["child", "nested"] },
      { id: "child", type: "rectangle", x: 20, y: 30, width: 10, height: 10, parentId: "group" },
      { id: "nested", type: "group", x: 40, y: 50, width: 40, height: 40, children: ["grandchild"], parentId: "group" },
      { id: "grandchild", type: "ellipse", x: 50, y: 60, width: 20, height: 20, parentId: "nested" },
    ] };
    expect([...getLayerTreeIds(nested, "group")]).toEqual(["group", "child", "nested", "grandchild"]);
  });

  it("moves a group and all descendants by the same delta", () => {
    const grouped: GraphicsDocument = { ...doc, layers: [
      { id: "group", type: "group", x: 100, y: 200, width: 100, height: 100, children: ["child"] },
      { id: "child", type: "rectangle", x: 120, y: 220, width: 20, height: 20, parentId: "group" },
      { id: "outside", type: "ellipse", x: 500, y: 600, width: 30, height: 30 },
    ] };
    const moved = moveLayersByDelta(grouped, getLayerTreeIds(grouped, "group"), 35, -15);
    expect(moved.layers.find(l => l.id === "group")).toMatchObject({ x: 135, y: 185 });
    expect(moved.layers.find(l => l.id === "child")).toMatchObject({ x: 155, y: 205 });
    expect(moved.layers.find(l => l.id === "outside")).toMatchObject({ x: 500, y: 600 });
  });
});
