import { describe, expect, it } from "vitest";
import { fromPolygons } from "./from-polygons";
import { deleteFace } from "./delete-face";
import { validateHalfEdgeMesh } from "./validate";

describe("half-edge deleteFace", () => {
  it("removes one face and keeps the vertices", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      faces: [[0, 1, 2], [0, 2, 3]],
    });

    const result = deleteFace(mesh, 0);

    expect(result.faces).toHaveLength(1);
    expect(result.vertices).toHaveLength(4);
    expect(result.positions).toEqual(mesh.positions);
    expect(validateHalfEdgeMesh(result).valid).toBe(true);
  });

  it("does not mutate the source mesh", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      faces: [[0, 1, 2]],
    });

    const result = deleteFace(mesh, 0);

    expect(mesh.faces).toHaveLength(1);
    expect(result.faces).toHaveLength(0);
  });

  it("rejects a missing face", () => {
    const mesh = fromPolygons({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [] });

    expect(() => deleteFace(mesh, 0)).toThrow(/missing face 0/);
    expect(() => deleteFace(mesh, -1)).toThrow(/missing face -1/);
  });
});
