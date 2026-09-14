import { describe, expect, it } from "vitest";
import { fromPolygons } from "./from-polygons";
import { addFace } from "./add-face";
import { validateHalfEdgeMesh } from "./validate";

describe("half-edge addFace", () => {
  it("adds a triangle from existing vertices", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      faces: [[0, 1, 2]],
    });

    const result = addFace(mesh, [0, 2, 3]);

    expect(result.vertices).toHaveLength(4);
    expect(result.faces).toHaveLength(2);
    expect(result.halfEdges).toHaveLength(6);
    expect(validateHalfEdgeMesh(result).valid).toBe(true);
  });

  it("preserves vertex positions and source mesh", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      faces: [],
    });

    const result = addFace(mesh, [0, 1, 2]);

    expect(result.positions).toEqual(mesh.positions);
    expect(mesh.faces).toHaveLength(0);
    expect(result.positions).not.toBe(mesh.positions);
  });

  it("rejects duplicate or same-direction edges", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
      faces: [[0, 1, 2]],
    });

    expect(() => addFace(mesh, [0, 1, 2])).toThrow(/already exists/);
    expect(() => addFace(mesh, [0, 1, 3])).toThrow(/edge 0:1 already exists/);
  });

  it("rejects invalid vertices and repeated vertices", () => {
    const mesh = fromPolygons({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [] });

    expect(() => addFace(mesh, [0, 1, 4])).toThrow(/missing vertex 4/);
    expect(() => addFace(mesh, [0, 1, 1])).toThrow(/three distinct vertices/);
  });
});
