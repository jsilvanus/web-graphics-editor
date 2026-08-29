import { describe, expect, it } from "vitest";
import type { GraphicsDocument, Layer } from "../types";
import { applyOperation, invertOperation } from "./operations";

const layer = (id: string, x = 0): Layer => ({ id, type: "rectangle", x, y: 0, width: 100, height: 100 });
const document = (...layers: Layer[]): GraphicsDocument => ({ width: 1920, height: 1080, background: "#111", layers });

function roundTrip(before: GraphicsDocument, operation: Parameters<typeof applyOperation>[1]) {
  const after = applyOperation(before, operation);
  expect(applyOperation(after, operation, true)).toEqual(before);
  expect(applyOperation(before, invertOperation(operation))).toEqual(after);
  return after;
}

describe("DocumentOperation", () => {
  it("adds and removes a layer", () => {
    const a = layer("a");
    expect(roundTrip(document(), { type: "add-layer", layer: a, index: 0 }).layers).toEqual([a]);
  });

  it("restores a removed layer at its original index", () => {
    const a = layer("a"), b = layer("b"), c = layer("c");
    const after = roundTrip(document(a, b, c), { type: "remove-layer", layer: b, index: 1 });
    expect(after.layers.map(x => x.id)).toEqual(["a", "c"]);
  });

  it("reorders a layer and restores its position", () => {
    const operation = { type: "reorder-layer" as const, layerId: "a", fromIndex: 0, toIndex: 2 };
    expect(roundTrip(document(layer("a"), layer("b"), layer("c")), operation).layers.map(x => x.id)).toEqual(["b", "c", "a"]);
  });

  it("round-trips transform, property and style changes", () => {
    const before = document({ ...layer("a"), x: 10, y: 20, rotation: 5, style: { opacity: 0.5 } });
    const operation = { type: "batch" as const, operations: [
      { type: "move-layer" as const, layerId: "a", from: { x: 10, y: 20 }, to: { x: 30, y: 40 } },
      { type: "resize-layer" as const, layerId: "a", from: { x: 10, y: 20, width: 100, height: 100 }, to: { x: 30, y: 40, width: 200, height: 150 } },
      { type: "rotate-layer" as const, layerId: "a", from: 5, to: 45 },
      { type: "set-layer-style" as const, layerId: "a", property: "opacity", from: 0.5, to: 0.8 },
      { type: "set-layer-property" as const, layerId: "a", property: "locked", from: undefined, to: true },
    ] };
    expect(roundTrip(before, operation).layers[0]).toMatchObject({ x: 30, y: 40, width: 200, height: 150, rotation: 45, locked: true, style: { opacity: 0.8 } });
  });

  it("batches operations and reverses them safely", () => {
    const a = layer("a");
    const operation = { type: "batch" as const, operations: [
      { type: "add-layer" as const, layer: a, index: 0 },
      { type: "move-layer" as const, layerId: "a", from: { x: 0, y: 0 }, to: { x: 50, y: 60 } },
    ] };
    expect(roundTrip(document(), operation).layers[0]).toMatchObject({ id: "a", x: 50, y: 60 });
  });

  it("restores interleaved layer order when undoing a group", () => {
    const a = { ...layer("a"), parentId: undefined };
    const b = { ...layer("b"), parentId: undefined };
    const c = { ...layer("c"), parentId: undefined };
    const group: Layer = { id: "g", type: "group", x: 0, y: 0, width: 200, height: 100, children: ["a", "c"] };
    const before = document(a, b, c);
    const operation = { type: "group-layers" as const, group, children: [{ layer: a, index: 0 }, { layer: c, index: 2 }], index: 0 };
    const after = roundTrip(before, operation);
    expect(after.layers.map(x => x.id)).toEqual(["g", "b", "a", "c"]);
    expect(after.layers.filter(x => x.parentId === "g").map(x => x.id)).toEqual(["a", "c"]);
  });

  it("restores the complete group when undoing an ungroup", () => {
    const a = { ...layer("a"), parentId: "g" };
    const b = { ...layer("b"), parentId: "g" };
    const group: Layer = { id: "g", type: "group", x: 0, y: 0, width: 100, height: 100, children: ["a", "b"] };
    const before = document(group, a, b);
    const operation = { type: "ungroup-layer" as const, group, children: [{ layer: a, index: 1 }, { layer: b, index: 2 }], index: 0 };
    const after = roundTrip(before, operation);
    expect(after.layers).toEqual([a, b]);
    expect(applyOperation(after, operation, true).layers).toEqual(before.layers);
  });
});
