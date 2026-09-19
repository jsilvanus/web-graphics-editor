import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../types";
import { duplicateFaces, extractFaces } from "./extract-faces";

function mesh(): Graphics3DMesh {
  return {
    id: "box",
    geometry: {
      vertices: [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 1, 0,
        2, 0, 0,
        2, 1, 0,
      ],
      indices: [0, 1, 2, 1, 3, 2, 1, 4, 3, 4, 5, 3],
    },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("face duplication and extraction", () => {
  it("duplicates selected faces with their own vertices", () => {
    const result = duplicateFaces(mesh(), new Set([0, 1]));
    expect(result.geometry.vertices).toHaveLength(12);
    expect(result.geometry.indices).toHaveLength(18);
    expect(result.geometry.indices.slice(-6)).toEqual([6, 7, 8, 7, 9, 8]);
  });

  it("extracts selected faces into an independent mesh", () => {
    const result = extractFaces(mesh(), new Set([1]));
    expect(result?.geometry.vertices).toHaveLength(9);
    expect(result?.geometry.indices).toEqual([0, 1, 2]);
    expect(result?.geometry.vertices).toEqual([
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,
    ]);
  });

  it("returns null for an empty selection", () => {
    expect(extractFaces(mesh(), new Set())).toBeNull();
  });
});
