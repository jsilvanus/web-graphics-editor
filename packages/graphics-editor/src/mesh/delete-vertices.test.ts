import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-primitives";
import { deleteVertices } from "./delete-vertices";

describe("deleteVertices", () => {
  it("removes incident triangles and compacts indices", () => {
    const mesh = {
      ...createBoxMesh("box"),
      geometry: {
        vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        indices: [0, 1, 2, 0, 2, 3],
      },
    };
    const result = deleteVertices(mesh, [0]);
    expect(result.geometry.vertices).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(result.geometry.indices).toEqual([0, 1, 2]);
  });

  it("does nothing for invalid or empty selection", () => {
    const mesh = createBoxMesh("box");
    expect(deleteVertices(mesh, [-1, 999])).toBe(mesh);
  });
});
