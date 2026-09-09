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
    expect(result.geometry.indices.length).toBe(mesh.geometry.indices.length + 3);
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

  it("ignores empty, zero and unsupported bevel requests", () => {
    const mesh = createBoxMesh("box");
    expect(bevelSelectedEdges(mesh, new Set(), 0.1)).toBe(mesh);
    expect(bevelSelectedEdges(mesh, new Set([edgeKey(0, 1)]), 0)).toBe(mesh);
    expect(hasBevelableEdge(mesh, edgeKey(0, 1))).toBe(true);
    expect(hasBevelableEdge(mesh, "99:100")).toBe(false);
  });
});
