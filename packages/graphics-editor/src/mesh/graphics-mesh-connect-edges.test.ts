import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../types";
import { connectGraphicsMeshEdges } from "./graphics-mesh-connect-edges";
import { edgeKey, meshEdges } from "../3d-mesh-topology";

function mesh(indices: number[], vertices: number[] = [
  0, 0, 0,
  1, 0, 0,
  0, 1, 0,
]): Graphics3DMesh {
  return {
    id: "test",
    geometry: { vertices, indices },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("connectGraphicsMeshEdges", () => {
  it("connects two edges of one triangle through their midpoints", () => {
    const source = mesh([0, 1, 2]);
    const result = connectGraphicsMeshEdges(
      source,
      edgeKey(0, 1),
      edgeKey(0, 2),
    );

    expect(result.mesh.geometry.vertices).toHaveLength(15);
    expect(result.mesh.geometry.indices).toHaveLength(12);
    expect(result.newFaceId).toBeGreaterThanOrEqual(0);
    expect(meshEdges(result.mesh)).toHaveLength(5);
  });

  it("rejects edges that do not meet in a common face", () => {
    const source = mesh(
      [0, 1, 2, 1, 3, 2],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
    );

    expect(() => connectGraphicsMeshEdges(
      source,
      edgeKey(0, 1),
      edgeKey(2, 3),
    )).toThrow(/common face/);
  });
});
