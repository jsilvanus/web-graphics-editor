import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-mesh";
import { addVertex } from "./add-vertex";

const meshWithGeometry = () => ({
  ...createBoxMesh("box"),
  geometry: {
    vertices: [0, 0, 0, 1, 0, 0],
    indices: [0, 1, 1],
  },
});

describe("addVertex", () => {
  it("appends a vertex without changing topology", () => {
    const mesh = meshWithGeometry();
    const next = addVertex(mesh, [2, 3, 4]);

    expect(next.geometry.vertices).toEqual([0, 0, 0, 1, 0, 0, 2, 3, 4]);
    expect(next.geometry.indices).toEqual(mesh.geometry.indices);
  });

  it("does not mutate the source mesh", () => {
    const mesh = meshWithGeometry();
    addVertex(mesh, [2, 3, 4]);
    expect(mesh.geometry.vertices).toEqual([0, 0, 0, 1, 0, 0]);
  });

  it("rejects non-finite positions as a no-op", () => {
    const mesh = meshWithGeometry();
    expect(addVertex(mesh, [0, Number.NaN, 1])).toBe(mesh);
    expect(addVertex(mesh, [0, Infinity, 1])).toBe(mesh);
  });
});
