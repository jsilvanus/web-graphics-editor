import { describe, expect, it } from "vitest";
import { fromPolygons } from "./from-polygons";
import { validateHalfEdgeMesh } from "./validate";

describe("half-edge mesh validation", () => {
  it("accepts valid meshes with sparse source face ids", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1,0,0, 0,1,0],
      faces: [[0,1], [0,1,2]],
    });

    expect(mesh.faces[0].id).toBe(1);
    expect(validateHalfEdgeMesh(mesh).valid).toBe(true);
  });

  it("reports a missing next edge without throwing", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1,0,0, 0,1,0],
      faces: [[0,1,2]],
    });
    mesh.halfEdges[0].next = 999;

    const result = validateHalfEdgeMesh(mesh);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("half-edge 0: missing next 999");
  });

  it("reports broken twin symmetry", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1,0,0, 1,1,0, 0,1,0],
      faces: [[0,1,2], [0,2,3]],
    });
    const shared = mesh.halfEdges.find(h => h.twin !== null)!;
    const twin = mesh.halfEdges.find(h => h.id === shared.twin)!;
    twin.twin = null;

    const result = validateHalfEdgeMesh(mesh);
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes("twin symmetry broken"))).toBe(true);
  });

  it("reports invalid vertex and face references", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1,0,0, 0,1,0],
      faces: [[0,1,2]],
    });
    mesh.halfEdges[0].vertex = 999;
    mesh.halfEdges[1].face = 999;

    const result = validateHalfEdgeMesh(mesh);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("half-edge 0: missing vertex 999");
    expect(result.errors).toContain("half-edge 1: missing face 999");
  });

  it("reports malformed position buffers", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1],
      faces: [],
    });

    const result = validateHalfEdgeMesh(mesh);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("positions length is not divisible by 3");
  });

  it("reports boundary cycles that do not close", () => {
    const mesh = fromPolygons({
      positions: [0,0,0, 1,0,0, 0,1,0],
      faces: [[0,1,2]],
    });
    mesh.halfEdges[2].next = 1;

    const result = validateHalfEdgeMesh(mesh);
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes("boundary cycle"))).toBe(true);
  });
});
