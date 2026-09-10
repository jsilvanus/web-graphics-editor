import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-primitives";
import { translateFaces } from "./translate-faces";

describe("translateFaces", () => {
  it("moves all unique vertices of the selected faces", () => {
    const mesh = {
      ...createBoxMesh("box"),
      geometry: {
        vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        indices: [0, 1, 2],
      },
    };

    const result = translateFaces(mesh, [0], [0, 0, 2]);

    expect(result.geometry.vertices).toEqual([0, 0, 2, 1, 0, 2, 0, 1, 2]);
    expect(result.geometry.indices).toEqual(mesh.geometry.indices);
  });

  it("moves shared vertices only once for adjacent selected faces", () => {
    const mesh = {
      ...createBoxMesh("box"),
      geometry: {
        vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
        indices: [0, 1, 2, 1, 3, 2],
      },
    };

    const result = translateFaces(mesh, [0, 1], [1, 0, 0]);

    expect(result.geometry.vertices).toEqual([1, 0, 0, 2, 0, 0, 1, 1, 0, 2, 1, 0]);
  });

  it("does nothing for an empty or invalid selection", () => {
    const mesh = createBoxMesh("box");
    expect(translateFaces(mesh, [], [1, 2, 3])).toBe(mesh);
    expect(translateFaces(mesh, [-1, 999], [1, 2, 3])).toBe(mesh);
  });
});
