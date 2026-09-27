import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../../types";
import { growFaceSelection, selectEdgeLoop, selectEdgeRing, shrinkFaceSelection } from "./selection";

function quad(): Graphics3DMesh {
  return {
    id: "test",
    geometry: {
      vertices: [
        0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 2, 0, 0, 2, 1, 0, 10, 0, 0, 11, 0, 0, 10, 1, 0, 11, 1, 0,
      ],
      indices: [0, 1, 2, 1, 3, 2, 1, 4, 3, 4, 5, 3, 6, 7, 8, 7, 9, 8],
    },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("edge loop and ring selection", () => {
  // Blender's meaning: a loop continues through vertices; a ring crosses quads to opposite edges.
  it("selects a ring by crossing each quad to the opposite edge, in both directions", () => {
    const data = quad();
    // The middle edge borders both quads, so the walk reaches the opposite edge on each side.
    expect([...selectEdgeRing(data, "1:3")].sort()).toEqual(["0:2", "1:3", "4:5"]);
  });

  it("infers a logical quad for ring traversal across triangulated faces", () => {
    const data = quad();
    expect([...selectEdgeRing(data, "0:1")].sort()).toEqual(["0:1", "2:3"]);
  });

  it("selects a connected loop without pulling in disconnected parallel edges", () => {
    const data = quad();
    expect([...selectEdgeLoop(data, "0:1")].sort()).toEqual(["0:1", "1:4"]);
    expect(selectEdgeLoop(data, "0:1")).not.toContain("6:7");
  });

  it("selects only the starting edge as a ring when there are no quads", () => {
    const triangle: Graphics3DMesh = {
      ...quad(),
      geometry: { vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] },
    };
    expect([...selectEdgeRing(triangle, "0:1")]).toEqual(["0:1"]);
  });
});

describe("face region selection", () => {
  it("grows one face by one edge-connected ring", () => {
    expect([...growFaceSelection(quad(), new Set([0]))].sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it("grows across the selected boundary on the next invocation", () => {
    expect([...growFaceSelection(quad(), new Set([0, 1]))].sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it("shrinks an edge-connected selection by one ring", () => {
    // Face 2 shares an edge with unselected face 3; mesh-boundary edges don't count.
    expect([...shrinkFaceSelection(quad(), new Set([0, 1, 2]))].sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it("does not cross a vertex-only contact", () => {
    const data = quad();
    data.geometry.indices = [0, 1, 2, 1, 3, 2, 4, 5, 3];
    expect([...growFaceSelection(data, new Set([0]))].sort((a, b) => a - b)).toEqual([0, 1]);
  });
});
