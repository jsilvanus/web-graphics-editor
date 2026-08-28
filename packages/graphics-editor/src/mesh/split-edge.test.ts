import { describe, expect, it } from "vitest";
import { fromPolygons } from "./from-polygons";
import { edgeIdForVertices } from "./topology";
import { splitEdge } from "./split-edge";
import { validateHalfEdgeMesh } from "./validate";

describe("half-edge splitEdge", () => {
  it("splits an interior edge into four triangles", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
      faces: [[0, 1, 2], [1, 3, 2]],
    });
    const edge = edgeIdForVertices(mesh, 1, 2);
    expect(edge).not.toBeNull();
    const result = splitEdge(mesh, edge!);
    expect(result.vertices).toHaveLength(5);
    expect(result.faces).toHaveLength(4);
    expect(result.positions.slice(-3)).toEqual([0.5, 0.5, 0]);
    expect(validateHalfEdgeMesh(result).valid).toBe(true);
  });

  it("splits a boundary edge into two triangles", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      faces: [[0, 1, 2]],
    });
    const edge = edgeIdForVertices(mesh, 0, 1);
    expect(edge).not.toBeNull();
    const result = splitEdge(mesh, edge!);
    expect(result.vertices).toHaveLength(4);
    expect(result.faces).toHaveLength(2);
    expect(result.positions.slice(-3)).toEqual([0.5, 0, 0]);
    expect(validateHalfEdgeMesh(result).valid).toBe(true);
  });

  it("supports a parametric split point", () => {
    const mesh = fromPolygons({
      positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
      faces: [[0, 1, 2]],
    });
    const edge = edgeIdForVertices(mesh, 0, 1)!;
    const result = splitEdge(mesh, edge, 0.25);
    expect(result.positions.slice(-3)).toEqual([0.5, 0, 0]);
  });
});
