import { describe, expect, it } from "vitest";
import { buildRenderTree } from "./render-model";
import type { GraphicsDocument } from "./types";

describe("render model", () => {
  it("normalizes groups, inherited opacity and visibility", () => {
    const document: GraphicsDocument = {
      width: 100,
      height: 100,
      layers: [
        { id: "background", type: "rectangle", x: 0, y: 0, width: 100, height: 100 },
        { id: "group", type: "group", x: 10, y: 10, width: 80, height: 80, opacity: 0.5, children: ["visible", "hidden"] },
        { id: "visible", type: "rectangle", x: 0, y: 0, width: 10, height: 10, parentId: "group", opacity: 0.8 },
        { id: "hidden", type: "rectangle", x: 0, y: 0, width: 10, height: 10, parentId: "group", visible: false }
      ]
    };
    const tree = buildRenderTree(document);
    expect(tree.map(node => node.layer.id)).toEqual(["background", "group"]);
    expect(tree[1].children.map(node => node.layer.id)).toEqual(["visible"]);
    expect(tree[1].children[0].opacity).toBeCloseTo(0.4);
  });

  it("keeps malformed parent links from disappearing from the root set", () => {
    const document: GraphicsDocument = { width: 10, height: 10, layers: [{ id: "orphan", type: "rectangle", x: 0, y: 0, width: 1, height: 1, parentId: "missing" }] };
    expect(buildRenderTree(document)).toEqual([]);
  });
});
