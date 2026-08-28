import { describe, expect, it } from "vitest";
import { add3DCamera, add3DMesh, create3DView, create3DWorld, remove3DWorld, set3DViewVisibility } from "./3d";
import { deserializeGraphicsDocument, serializeGraphicsDocument } from "./serialization";
import type { Graphics3DCamera, Graphics3DMesh, Graphics3DWorld, GraphicsDocument } from "./types";

const camera: Graphics3DCamera = {
  id: "camera-wide",
  position: [0, 0, 10],
  rotation: [0, 0, 0],
  projection: "perspective",
  fov: 50,
};

const mesh: Graphics3DMesh = {
  id: "cube",
  geometry: { vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] },
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  provenance: { source: "generated", createdBy: "cube-generator" },
};

const world: Graphics3DWorld = { id: "kitchen", meshes: [], cameras: [camera] };
const document: GraphicsDocument = { width: 1920, height: 1080, layers: [] };

describe("3D document operations", () => {
  it("creates a world and adds arbitrary mesh geometry", () => {
    const withWorld = create3DWorld(document, world);
    const withMesh = add3DMesh(withWorld, "kitchen", mesh);
    expect(withMesh.worlds3d?.[0].meshes[0]).toEqual(mesh);
    expect(withMesh.worlds3d?.[0].meshes[0].geometry.indices).toEqual([0, 1, 2]);
  });

  it("creates a view and changes its visibility without changing the world", () => {
    const withWorld = create3DWorld(document, world);
    const withView = create3DView(withWorld, {
      id: "kettle-view", worldId: "kitchen", cameraId: "camera-wide",
      x: 100, y: 100, width: 800, height: 600,
    });
    const filtered = set3DViewVisibility(withView, "kettle-view", { mode: "include", objects: ["cube"] });
    expect(filtered.views3d?.[0].visibility).toEqual({ mode: "include", objects: ["cube"] });
    expect(filtered.worlds3d?.[0]).toEqual(world);
  });

  it("removes a world and its dependent views", () => {
    const withWorld = create3DWorld(document, world);
    const withView = create3DView(withWorld, { id: "view", worldId: "kitchen", cameraId: "camera-wide", x: 0, y: 0, width: 100, height: 100 });
    const removed = remove3DWorld(withView, "kitchen");
    expect(removed.worlds3d).toEqual([]);
    expect(removed.views3d).toEqual([]);
  });

  it("serializes and deserializes 3D data and provenance", () => {
    const source = add3DMesh(create3DWorld(document, world), "kitchen", mesh);
    const restored = deserializeGraphicsDocument(serializeGraphicsDocument(source));
    expect(restored.worlds3d).toEqual(source.worlds3d);
    expect(restored.worlds3d?.[0].meshes[0].provenance?.source).toBe("generated");
  });

  it("adds cameras without changing existing meshes", () => {
    const withWorld = create3DWorld(document, world);
    const secondCamera = { ...camera, id: "camera-close", projection: "orthographic" as const };
    const updated = add3DCamera(add3DMesh(withWorld, "kitchen", mesh), "kitchen", secondCamera);
    expect(updated.worlds3d?.[0].meshes).toHaveLength(1);
    expect(updated.worlds3d?.[0].cameras.map(item => item.id)).toEqual(["camera-wide", "camera-close"]);
  });
});
