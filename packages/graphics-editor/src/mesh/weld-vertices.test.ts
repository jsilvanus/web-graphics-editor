import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-primitives";
import { weldVertices } from "./weld-vertices";

describe("weldVertices", () => {
  it("welds vertices within tolerance", () => {
    const mesh = { ...createBoxMesh("box"), geometry: { vertices: [0, 0, 0, 0.00001, 0, 0, 1, 0, 0], indices: [0, 1, 2] } };
    const result = weldVertices(mesh, undefined, 0.001);
    expect(result.geometry.vertices).toEqual([0, 0, 0, 1, 0, 0]);
    expect(result.geometry.indices).toEqual([0, 0, 1]);
  });

  it("can restrict welding to selected vertices", () => {
    const mesh = { ...createBoxMesh("box"), geometry: { vertices: [0, 0, 0, 0.00001, 0, 0, 1, 0, 0], indices: [0, 1, 2] } };
    const result = weldVertices(mesh, [1], 0.001);
    expect(result.geometry.vertices).toEqual([0, 0, 0, 1, 0, 0]);
    expect(result.geometry.indices).toEqual([0, 0, 1]);
  });

  it("leaves vertices outside tolerance unchanged", () => {
    const mesh = { ...createBoxMesh("box"), geometry: { vertices: [0, 0, 0, 0.1, 0, 0], indices: [0, 1, 1] } };
    const result = weldVertices(mesh, undefined, 0.001);
    expect(result.geometry.vertices).toEqual(mesh.geometry.vertices);
    expect(result.geometry.indices).toEqual(mesh.geometry.indices);
  });
});
