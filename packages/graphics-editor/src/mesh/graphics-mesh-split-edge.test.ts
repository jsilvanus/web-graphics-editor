import { describe, expect, it } from "vitest";
import { splitGraphicsMeshEdges } from "./graphics-mesh-split-edge";
import { edgeKey, meshEdges } from "../3d-mesh-topology";
import type { Graphics3DMesh } from "../types";

function mesh(indices: number[], vertices: number[]): Graphics3DMesh {
  return {
    id: "test",
    name: "test",
    geometry: { vertices, indices },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("splitGraphicsMeshEdges", () => {
  it("splits a boundary edge and preserves triangle indexing", () => {
    const source = mesh([0, 1, 2], [0, 0, 0, 1, 0, 0, 0, 1, 0]);

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(0, 1)]));

    expect(result.geometry.vertices).toHaveLength(12);
    expect(result.geometry.indices).toHaveLength(6);
    // Two triangles sharing the new spoke: 3 original sides (one now halved) + the spoke = 5 edges.
    expect(meshEdges(result)).toHaveLength(5);
  });

  it("splits an interior edge and creates four triangles", () => {
    const source = mesh([0, 1, 2, 1, 3, 2], [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(1, 2)]));

    expect(result.geometry.vertices).toHaveLength(15);
    expect(result.geometry.indices).toHaveLength(12);
    // A fan of four triangles around the midpoint: 4 spokes + 4 outer edges.
    expect(meshEdges(result)).toHaveLength(8);
  });

  it("splits multiple independent edges", () => {
    const source = mesh([0, 1, 2, 1, 3, 2], [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(0, 1), edgeKey(2, 3)]));

    expect(result.geometry.vertices).toHaveLength(18);
    // Each boundary split turns one triangle into two: 2 + 2 = 4 triangles.
    expect(result.geometry.indices).toHaveLength(12);
  });
});
