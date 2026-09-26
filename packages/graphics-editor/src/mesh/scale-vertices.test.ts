import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-primitives";
import { scaleVertices } from "./scale-vertices";

const meshWithVertices = (vertices: number[]) => ({
  ...createBoxMesh("box"),
  geometry: { vertices, indices: [0, 1, 2] },
});

describe("scaleVertices", () => {
  it("scales selected vertices about a pivot", () => {
    const mesh = meshWithVertices([1, 0, 0, 3, 0, 0, 5, 5, 5]);
    const next = scaleVertices(mesh, [0, 1], [2, 0, 0], [2, 1, 1]);
    expect(next.geometry.vertices).toEqual([0, 0, 0, 4, 0, 0, 5, 5, 5]);
  });

  it("scales along the axes of the orientation", () => {
    // 90° about Z: local X points along world Y.
    const s = Math.SQRT1_2;
    const mesh = meshWithVertices([0, 1, 0, 1, 0, 0, 0, 0, 0]);
    const next = scaleVertices(mesh, [0, 1], [0, 0, 0], [3, 1, 1], [0, 0, s, s]);
    const v = next.geometry.vertices;
    expect(v[1]).toBeCloseTo(3);
    expect(v[3]).toBeCloseTo(1);
  });

  it("ignores out-of-range vertex ids and leaves the input untouched", () => {
    const mesh = meshWithVertices([1, 1, 1]);
    const next = scaleVertices(mesh, [4, -1], [0, 0, 0], [2, 2, 2]);
    expect(next.geometry.vertices).toEqual([1, 1, 1]);
    expect(mesh.geometry.vertices).toEqual([1, 1, 1]);
  });
});
