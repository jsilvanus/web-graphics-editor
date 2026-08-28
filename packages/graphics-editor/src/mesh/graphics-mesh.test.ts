import { describe, expect, it } from "vitest";
import { createBoxMesh } from "../3d-primitives";
import { graphicsMeshFaces, graphicsMeshToHalfEdge, halfEdgeToGraphicsMesh, updateGraphicsMeshTopology } from "./graphics-mesh";
import { validateHalfEdgeMesh } from "./validate";

const mesh = createBoxMesh("box");

describe("Graphics3DMesh topology adapter", () => {
  it("builds valid half-edge topology from render geometry", () => {
    const topology = graphicsMeshToHalfEdge(mesh);
    expect(validateHalfEdgeMesh(topology).valid).toBe(true);
    expect(topology.vertices).toHaveLength(mesh.geometry.vertices.length / 3);
    expect(topology.faces).toHaveLength(mesh.geometry.indices.length / 3);
  });

  it("round-trips topology without changing triangle geometry", () => {
    const topology = graphicsMeshToHalfEdge(mesh);
    const roundTrip = halfEdgeToGraphicsMesh(mesh, topology);
    expect(roundTrip.geometry.vertices).toEqual(mesh.geometry.vertices);
    expect(roundTrip.geometry.indices).toEqual(mesh.geometry.indices);
  });

  it("exposes polygon faces from Graphics3DMesh", () => {
    expect(graphicsMeshFaces(mesh)).toHaveLength(mesh.geometry.indices.length / 3);
  });

  it("can apply a topology transformation and return Graphics3DMesh", () => {
    const result = updateGraphicsMeshTopology(mesh, topology => topology);
    expect(result.geometry.indices).toEqual(mesh.geometry.indices);
  });
});
