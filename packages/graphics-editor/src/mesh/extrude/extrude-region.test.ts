import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../../3d-primitives";
import { extrudeRegion } from "./extrude-region";

function vertices(mesh: ReturnType<typeof createBoxMesh>, ids: number[]) {
  return ids.map(id => mesh.geometry.vertices.slice(id * 3, id * 3 + 3));
}

describe("extrudeRegion", () => {
  it("extrudes two coplanar triangles as one region", () => {
    const mesh = createBoxMesh("box");
    const result = extrudeRegion(mesh, new Set([0, 1]), 1);

    expect(result.geometry.vertices).toHaveLength(mesh.geometry.vertices.length + 4 * 3);
    expect(result.geometry.indices).toHaveLength(mesh.geometry.indices.length + 4 * 6);
    expect(vertices(result, [8, 9, 10, 11])).toEqual([
      [-0.5, -0.5, -1.5],
      [0.5, -0.5, -1.5],
      [0.5, 0.5, -1.5],
      [-0.5, 0.5, -1.5],
    ]);
  });

  it("is independent of face-selection order", () => {
    const mesh = createBoxMesh("box");
    const a = extrudeRegion(mesh, new Set([0, 1]), 0.25);
    const b = extrudeRegion(mesh, new Set([1, 0]), 0.25);
    expect(b.geometry.vertices).toEqual(a.geometry.vertices);
    expect(b.geometry.indices).toEqual(a.geometry.indices);
  });

  it("does not create an internal wall between selected faces", () => {
    const mesh = createBoxMesh("box");
    const result = extrudeRegion(mesh, new Set([0, 1]), 1);
    const appended = result.geometry.indices.slice(mesh.geometry.indices.length);
    expect(appended).toHaveLength(24);
  });

  it("keeps disconnected selected regions separate", () => {
    const mesh = createBoxMesh("box");
    const result = extrudeRegion(mesh, new Set([0, 2]), 1);
    expect(result.geometry.vertices).toHaveLength(mesh.geometry.vertices.length + 6 * 3);
    expect(result.geometry.indices).toHaveLength(mesh.geometry.indices.length + 6 * 6);
  });

  it("does not weld regions that only touch at a vertex", () => {
    const mesh = createBoxMesh("box");
    // Faces 0 and 6 share vertex 2 but do not share an edge.
    const result = extrudeRegion(mesh, new Set([0, 6]), 1);
    expect(result.geometry.vertices).toHaveLength(mesh.geometry.vertices.length + 6 * 3);
  });

  it("ignores empty, invalid, and non-finite requests", () => {
    const mesh = createBoxMesh("box");
    expect(extrudeRegion(mesh, new Set(), 1)).toBe(mesh);
    expect(extrudeRegion(mesh, new Set([999]), 1)).toBe(mesh);
    expect(extrudeRegion(mesh, new Set([0]), Number.NaN)).toBe(mesh);
  });
});
