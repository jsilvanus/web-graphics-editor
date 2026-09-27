import { describe, expect, it } from "vitest";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import { createBoxMesh } from "../../3d-primitives";
import { bevelSelectedEdges, hasBevelableEdge } from "./bevel-edge";

describe("mesh edge bevel", () => {
  it("bevels an interior edge and preserves the surrounding face count", () => {
    const mesh = createBoxMesh("box");
    const result = bevelSelectedEdges(mesh, new Set([edgeKey(0, 1)]), 0.1);

    expect(result.geometry.vertices.length).toBe(mesh.geometry.vertices.length + 12);
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length + 6);
    expect(meshEdges(result).some(edge => edgeKey(edge.a, edge.b) === edgeKey(0, 1))).toBe(false);
  });

  it("bevels a boundary edge with a strip back to the original boundary", () => {
    const mesh = {
      ...createBoxMesh("triangle"),
      geometry: { vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] },
    };
    const result = bevelSelectedEdges(mesh, new Set([edgeKey(0, 1)]), 0.1);

    expect(result.geometry.vertices.length).toBe(mesh.geometry.vertices.length + 6);
    // The face keeps one triangle and the strip back to the boundary adds a quad (two triangles).
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length + 6);
    expect(meshEdges(result).some(edge => edgeKey(edge.a, edge.b) === edgeKey(0, 1))).toBe(true);
  });

  it("bevels adjacent selected edges in one pass", () => {
    const mesh = createBoxMesh("box");
    const result = bevelSelectedEdges(mesh, new Set([edgeKey(0, 1), edgeKey(1, 2)]), 0.1);

    expect(result.geometry.vertices.length).toBe(mesh.geometry.vertices.length + 24);
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length + 15);
    expect(meshEdges(result).some(edge => edgeKey(edge.a, edge.b) === edgeKey(0, 1))).toBe(false);
    expect(meshEdges(result).some(edge => edgeKey(edge.a, edge.b) === edgeKey(1, 2))).toBe(false);
  });

  it("winds new faces like the surface they replace", () => {
    // Flat meshes in the z = 0 plane, wound counter-clockwise: every result triangle must be too.
    const flat = (indices: number[]) => ({
      ...createBoxMesh("flat"),
      geometry: { vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], indices },
    });
    const windings = (g: { vertices: number[]; indices: number[] }) => {
      const p = (i: number) => [g.vertices[i * 3], g.vertices[i * 3 + 1]];
      const out: number[] = [];
      for (let i = 0; i < g.indices.length; i += 3) {
        const [a, b, c] = [p(g.indices[i]), p(g.indices[i + 1]), p(g.indices[i + 2])];
        out.push(Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])));
      }
      return out;
    };
    const boundary = bevelSelectedEdges(flat([0, 1, 2]), new Set([edgeKey(0, 1)]), 0.1);
    const interior = bevelSelectedEdges(flat([0, 1, 2, 1, 3, 2]), new Set([edgeKey(1, 2)]), 0.1);
    expect(windings(boundary.geometry).every(sign => sign === 1)).toBe(true);
    expect(windings(interior.geometry).every(sign => sign === 1)).toBe(true);
  });

  it("ignores empty, zero and unsupported bevel requests", () => {
    const mesh = createBoxMesh("box");
    expect(bevelSelectedEdges(mesh, new Set(), 0.1)).toBe(mesh);
    expect(bevelSelectedEdges(mesh, new Set([edgeKey(0, 1)]), 0)).toBe(mesh);
    expect(hasBevelableEdge(mesh, edgeKey(0, 1))).toBe(true);
    expect(hasBevelableEdge(mesh, "99:100")).toBe(false);
  });
});
