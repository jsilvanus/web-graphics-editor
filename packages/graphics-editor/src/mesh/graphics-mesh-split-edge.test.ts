import { describe, expect, it } from "vitest";
import { splitGraphicsMeshEdges } from "./graphics-mesh-split-edge";
import { edgeKey, meshEdges } from "../3d-mesh-topology";
import type { Graphics3DMesh } from "../types";

function mesh(indices: number[], vertices: number[]): Graphics3DMesh {
  return { id: "test", name: "test", geometry: { vertices, indices } };
}

describe("splitGraphicsMeshEdges", () => {
  it("splits a boundary edge and preserves triangle indexing", () => {
    const source = mesh(
      [0, 1, 2],
      [0, 0, 0, 1, 0, 0, 0, 1, 0],
    );

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(0, 1)]));

    expect(result.geometry.vertices).toHaveLength(12);
    expect(result.geometry.indices).toHaveLength(6);
    expect(meshEdges(result)).toHaveLength(4);
  });

  it("splits an interior edge and creates four triangles", () => {
    const source = mesh(
      [0, 1, 2, 1, 3, 2],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
    );

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(1, 2)]));

    expect(result.geometry.vertices).toHaveLength(15);
    expect(result.geometry.indices).toHaveLength(12);
    expect(meshEdges(result)).toHaveLength(6);
  });

  it("splits multiple independent edges", () => {
    const source = mesh(
      [0, 1, 2, 1, 3, 2],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
    );

    const result = splitGraphicsMeshEdges(source, new Set([edgeKey(0, 1), edgeKey(2, 3)]));

    expect(result.geometry.vertices).toHaveLength(18);
    expect(result.geometry.indices).toHaveLength(18);
  });
});
