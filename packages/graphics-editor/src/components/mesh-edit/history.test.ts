import { describe, expect, it } from "vitest";
import type { Graphics3DMesh } from "../../types";
import { sameGeometry, snapshotMeshEditState } from "./history";

const mesh = (): Graphics3DMesh => ({
  id: "mesh",
  geometry: {
    vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uv: [0, 0, 1, 0, 0, 1],
  },
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
});

describe("mesh edit history", () => {
  it("treats normal changes as a geometry change", () => {
    const a = mesh();
    const b = mesh();
    b.geometry.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1];
    expect(sameGeometry(a, b)).toBe(false);
  });

  it("treats UV changes as a geometry change", () => {
    const a = mesh();
    const b = mesh();
    b.geometry.uv = [0, 0, 0.5, 0, 0, 1];
    expect(sameGeometry(a, b)).toBe(false);
  });

  it("deep-clones history geometry and selection", () => {
    const a = mesh();
    const selection = { vertices: new Set([0]), edges: new Set(["0:1"]), faces: new Set([0]) };
    const snapshot = snapshotMeshEditState(a, "faces", "scale", selection);
    a.geometry.vertices[0] = 42;
    selection.faces.clear();
    expect(snapshot.data.geometry.vertices[0]).toBe(0);
    expect(snapshot.selection.faces).toEqual(new Set([0]));
  });
});
