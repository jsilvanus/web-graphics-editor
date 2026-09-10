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

    // Two selected triangles form one quad. The shared edge stays internal,
    // so only four boundary edges receive side walls.
    expect(result.geometry.vertices).toHaveLength(mesh.geometry.vertices.length + 4 * 3);
    expect(result.geometry.indices).toHaveLength(mesh.geometry.indices.length + 4 * 6);

    // The first box face points toward -Z; its four top vertices therefore move
    // one unit in -Z.
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

    // The original two triangles remain represented by two top triangles;
    // exactly four boundary quads (8 triangles) are appended.
    const appended = result.geometry.indices.slice(mesh.geometry.indices.length);
    expect(appended).toHaveLength(24);
    expect(appended).not.toContain(8);
  });

  it("keeps disconnected selected regions separate", () => {
    const mesh = createBoxMesh("box");
    const result = extrudeRegion(mesh, new Set([0, 2]), 1);

    // These faces do not share an edge, so each gets its own three top vertices
    // and three side-wall quads.
    expect(result.geometry.vertices).toHaveLength(mesh.geometry.vertices.length + 6 * 3);
    expect(result.geometry.indices).toHaveLength(mesh.geometry.indices.length + 6 * 6);
  });

  it("ignores empty, invalid, and non-finite requests", () => {
    const mesh = createBoxMesh("box");
    expect(extrudeRegion(mesh, new Set(), 1)).toBe(mesh);
    expect(extrudeRegion(mesh, new Set([999]), 1)).toBe(mesh);
    expect(extrudeRegion(mesh, new Set([0]), Number.NaN)).toBe(mesh);
  });
});
