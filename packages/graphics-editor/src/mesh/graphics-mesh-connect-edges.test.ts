import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../types";
import { connectGraphicsMeshEdges } from "./graphics-mesh-connect-edges";
import { edgeKey, meshEdges } from "../3d-mesh-topology";

function mesh(indices: number[], vertices: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]): Graphics3DMesh {
  return {
    id: "test",
    geometry: { vertices, indices },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("connectGraphicsMeshEdges", () => {
  it("creates a cut path between edges across adjacent triangles", () => {
    const source = mesh([0, 1, 2, 1, 3, 2]);
    const result = connectGraphicsMeshEdges(source, edgeKey(0, 1), edgeKey(2, 3));

    expect(result.mesh.geometry.vertices).toHaveLength(21);
    expect(result.mesh.geometry.indices).toHaveLength(12);
    expect(result.mesh.geometry.normals).toBeUndefined();
    expect(meshEdges(result.mesh)).toHaveLength(7);
  });

  it("rejects an edge selected twice", () => {
    const source = mesh([0, 1, 2]);
    expect(() => connectGraphicsMeshEdges(source, edgeKey(0, 1), edgeKey(0, 1))).toThrow(/itself/);
  });
});
