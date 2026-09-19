import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../../types";
import { growFaceSelection, selectEdgeLoop, selectEdgeRing, shrinkFaceSelection } from "./selection";

function quad(): Graphics3DMesh {
  return {
    id: "test",
    geometry: {
      vertices: [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 1, 0,
        2, 0, 0,
        2, 1, 0,
      ],
      indices: [
        0, 1, 2,
        1, 3, 2,
        1, 4, 3,
        4, 5, 3,
      ],
    },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("edge loop and ring selection", () => {
  it("follows a geometric edge loop through opposite directions", () => {
    const data = quad();
    expect([...selectEdgeLoop(data, "1:3")].sort()).toEqual(["0:1", "1:3", "3:4"]);
  });

  it("selects a geometric ring of parallel edges", () => {
    const data = quad();
    expect([...selectEdgeRing(data, "0:1")].sort()).toEqual(["0:1", "1:4", "2:3", "4:5"]);
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
    expect([...shrinkFaceSelection(quad(), new Set([0, 1, 2]))].sort((a, b) => a - b)).toEqual([1]);
  });

  it("does not cross a vertex-only contact", () => {
    const data = quad();
    data.geometry.indices = [0, 1, 2, 1, 3, 2, 4, 5, 3];
    expect([...growFaceSelection(data, new Set([0]))].sort((a, b) => a - b)).toEqual([0, 1]);
  });
});
