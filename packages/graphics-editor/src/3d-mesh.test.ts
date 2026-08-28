import { describe, expect, it } from "vitest";
import { createBoxMesh } from "./3d-primitives";
import { deleteMeshFaces, extrudeMeshFace, mergeMeshVertices, moveMeshVertices } from "./3d-mesh";

describe("3D mesh operations", () => {
  it("moves selected vertices without changing topology", () => {
    const mesh = createBoxMesh("box");
    const moved = moveMeshVertices(mesh, [0], [1, 2, 3]);
    expect(moved.geometry.vertices.slice(0, 3)).toEqual([0.5, 1.5, 2.5]);
    expect(moved.geometry.indices).toEqual(mesh.geometry.indices);
  });

  it("deletes faces and compacts vertices", () => {
    const mesh = createBoxMesh("box");
    const result = deleteMeshFaces(mesh, [0]);
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length - 3);
    expect(result.geometry.vertices.length).toBeLessThan(mesh.geometry.vertices.length);
  });

  it("merges duplicate vertices", () => {
    const mesh = { ...createBoxMesh("box"), geometry: { vertices: [0, 0, 0, 0.00001, 0, 0, 1, 0, 0], indices: [0, 1, 2] } };
    const result = mergeMeshVertices(mesh, 0.001);
    expect(result.geometry.vertices).toHaveLength(6);
    expect(result.geometry.indices).toEqual([0, 0, 1]);
  });

  it("extrudes a triangle face", () => {
    const mesh = createBoxMesh("box");
    const result = extrudeMeshFace(mesh, 0, 0.25);
    expect(result.geometry.vertices.length).toBe(mesh.geometry.vertices.length + 9);
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length + 15);
  });
});
