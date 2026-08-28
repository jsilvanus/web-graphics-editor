import { describe, expect, it } from "vitest";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import { edgeFaces, faceVertices } from "./topology";
import { validateHalfEdgeMesh } from "./validate";

describe("half-edge mesh core", () => {
  const mesh = fromPolygons({
    positions: [0,0,0, 1,0,0, 1,1,0, 0,1,0],
    faces: [[0,1,2], [0,2,3]],
  });

  it("builds shared connectivity", () => {
    expect(mesh.edges).toHaveLength(5);
    expect(mesh.halfEdges).toHaveLength(6);
    expect(validateHalfEdgeMesh(mesh).valid).toBe(true);
    expect(edgeFaces(mesh, 2)).toHaveLength(2);
  });

  it("walks polygon boundaries", () => {
    expect(faceVertices(mesh, 0)).toEqual([0,1,2]);
    expect(polygonsFromHalfEdges(mesh)).toEqual([[0,1,2],[0,2,3]]);
  });
});
