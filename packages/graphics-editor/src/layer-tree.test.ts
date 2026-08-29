import { describe, expect, it } from "vitest";
import { getChildLayers, getDescendantIds, getRootLayers } from "./layer-tree";
import type { Layer } from "./types";

const layers: Layer[] = [
  { id: "group", type: "group", x: 0, y: 0, width: 100, height: 100, children: ["a", "nested"] },
  { id: "a", type: "rectangle", x: 0, y: 0, width: 10, height: 10, parentId: "group" },
  { id: "nested", type: "group", x: 0, y: 0, width: 20, height: 20, parentId: "group", children: ["b"] },
  { id: "b", type: "ellipse", x: 0, y: 0, width: 5, height: 5, parentId: "nested" },
  { id: "root", type: "text", x: 0, y: 0, width: 10, height: 10 },
];

describe("layer tree", () => {
  it("returns only root layers", () => {
    expect(getRootLayers(layers).map(layer => layer.id)).toEqual(["group", "root"]);
  });

  it("resolves children in declared order", () => {
    expect(getChildLayers(layers, "group").map(layer => layer.id)).toEqual(["a", "nested"]);
  });

  it("collects descendants recursively", () => {
    expect([...getDescendantIds(layers, "group")]).toEqual(["group", "a", "nested", "b"]);
  });
});
