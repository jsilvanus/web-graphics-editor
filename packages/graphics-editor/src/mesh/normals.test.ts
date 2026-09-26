import { describe, expect, it } from "vitest";
import { flipFaces, recalculateNormals } from "./normals";
import type { Graphics3DMesh } from "../types";

function mesh(indices: number[], vertices = [0, 0, 0, 1, 0, 0, 0, 1, 0]): Graphics3DMesh {
  return {
    id: "test",
    geometry: { vertices, indices },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}

describe("mesh normals", () => {
  it("recalculates area-weighted vertex normals", () => {
    const result = recalculateNormals(mesh([0, 1, 2]));
    expect(result.geometry.normals).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  });

  it("averages normals across adjacent coplanar triangles", () => {
    const result = recalculateNormals(mesh([0, 1, 2, 0, 2, 3], [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]));
    expect(result.geometry.normals).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  });

  it("flips selected face winding and invalidates normals", () => {
    const source = mesh([0, 1, 2], [0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const withNormals = recalculateNormals(source);
    const result = flipFaces(withNormals, new Set([0]));
    expect(result.geometry.indices).toEqual([0, 2, 1]);
    expect(result.geometry.normals).toBeUndefined();
  });

  it("leaves geometry unchanged when no faces are selected", () => {
    const source = mesh([0, 1, 2]);
    expect(flipFaces(source, new Set())).toBe(source);
  });
});
