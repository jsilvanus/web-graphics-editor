import { describe, expect, it } from "vitest";
import { createBoxMesh } from "./3d-primitives";
import { createThreeCamera, createThreeGeometry, createThreeScene } from "./3d-renderer";
import type { Graphics3DCamera, Graphics3DWorld } from "./types";

const camera: Graphics3DCamera = {
  id: "camera",
  position: [0, 0, 10],
  rotation: [0, 0, 0],
  projection: "perspective",
  fov: 60,
};

describe("Three.js 3D renderer", () => {
  it("maps arbitrary mesh geometry to BufferGeometry", () => {
    const mesh = createBoxMesh("box", 2, 4, 6);
    const geometry = createThreeGeometry(mesh);
    expect(geometry.getAttribute("position").count).toBe(8);
    expect(geometry.getIndex()?.count).toBe(36);
    expect(geometry.getAttribute("normal")).toBeDefined();
    geometry.dispose();
  });

  it("creates a scene with transformed mesh and lights", () => {
    const mesh = createBoxMesh("box", 2, 4, 6, {
      position: [1, 2, 3], rotation: [0.1, 0.2, 0.3], scale: [2, 1, 0.5],
    });
    const world: Graphics3DWorld = {
      id: "world",
      meshes: [mesh],
      cameras: [camera],
      lights: [{ id: "light", type: "ambient", intensity: 0.5 }],
    };
    const scene = createThreeScene(world);
    const object = scene.getObjectByName("box");
    expect(object).toBeDefined();
    expect(object?.position.toArray()).toEqual([1, 2, 3]);
    expect(object?.scale.toArray()).toEqual([2, 1, 0.5]);
    expect(scene.children).toHaveLength(2);
  });

  it("applies include and exclude visibility filters", () => {
    const world: Graphics3DWorld = {
      id: "world",
      meshes: [createBoxMesh("one"), createBoxMesh("two")],
      cameras: [camera],
    };
    expect(createThreeScene(world, { visibility: { mode: "include", objects: ["one"] } }).getObjectByName("one")).toBeDefined();
    expect(createThreeScene(world, { visibility: { mode: "include", objects: ["one"] } }).getObjectByName("two")).toBeUndefined();
    expect(createThreeScene(world, { visibility: { mode: "exclude", objects: ["one"] } }).getObjectByName("one")).toBeUndefined();
  });

  it("creates both perspective and orthographic cameras", () => {
    const perspective = createThreeCamera(camera, 2);
    const orthographic = createThreeCamera({ ...camera, projection: "orthographic", zoom: 2 }, 2);
    expect(perspective.type).toBe("PerspectiveCamera");
    expect(orthographic.type).toBe("OrthographicCamera");
  });
});
