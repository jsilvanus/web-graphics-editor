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

    // Two edge midpoints plus the point where the cut crosses the diagonal.
    expect(result.mesh.geometry.vertices).toHaveLength(21);
    // 7 vertices, 6 on the boundary: a planar triangulation has 2·7 − 6 − 2 = 6 triangles
    // and (3·6 + 6) / 2 = 12 edges.
    expect(result.mesh.geometry.indices).toHaveLength(18);
    expect(result.mesh.geometry.normals).toBeUndefined();
    expect(meshEdges(result.mesh)).toHaveLength(12);
  });

  it("rejects an edge selected twice", () => {
    const source = mesh([0, 1, 2]);
    expect(() => connectGraphicsMeshEdges(source, edgeKey(0, 1), edgeKey(0, 1))).toThrow(/itself/);
  });
});
