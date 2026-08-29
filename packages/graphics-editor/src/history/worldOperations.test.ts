import { describe, expect, it } from "vitest";
import { applyWorldOperation, invertWorldOperation, type WorldOperation } from "./worldOperations";
import type { Graphics3DWorld } from "../types";

const world = (): Graphics3DWorld => ({ id: "w", meshes: [{ id: "m", geometry: { vertices: [], indices: [] }, transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } }], cameras: [{ id: "c", position: [0,0,0], rotation: [0,0,0], projection: "perspective" }], lights: [] });
const roundTrip = (initial: Graphics3DWorld, op: WorldOperation) => {
  const changed = applyWorldOperation(initial, op);
  return applyWorldOperation(changed, op, true);
};

describe("3D world history operations", () => {
  it("adds, removes and updates meshes", () => {
    const initial = world(); const mesh = { ...initial.meshes[0], id: "m2" };
    expect(applyWorldOperation(initial, { type: "add-mesh", mesh })).toMatchObject({ meshes: [{ id: "m" }, { id: "m2" }] });
    expect(applyWorldOperation(initial, { type: "remove-mesh", mesh: initial.meshes[0], index: 0 }).meshes).toHaveLength(0);
    const updated = applyWorldOperation(initial, { type: "update-mesh", meshId: "m", from: { name: undefined }, to: { name: "Cube" } });
    expect(updated.meshes[0].name).toBe("Cube");
  });
  it("adds, removes and updates cameras", () => {
    const initial = world(); const camera = { id: "c2", position: [1,2,3] as [number,number,number], rotation: [0,0,0] as [number,number,number], projection: "orthographic" as const };
    expect(applyWorldOperation(initial, { type: "add-camera", camera }).cameras).toHaveLength(2);
    expect(applyWorldOperation(initial, { type: "remove-camera", camera: initial.cameras[0], index: 0 }).cameras).toHaveLength(0);
    expect(applyWorldOperation(initial, { type: "update-camera", cameraId: "c", from: { name: undefined }, to: { name: "Main" } }).cameras[0].name).toBe("Main");
  });
  it("adds, removes and updates lights", () => {
    const initial = world(); const light = { id: "l", type: "point" as const, intensity: 2 };
    expect(applyWorldOperation(initial, { type: "add-light", light }).lights).toHaveLength(1);
    const withLight = applyWorldOperation(initial, { type: "add-light", light });
    expect(applyWorldOperation(withLight, { type: "remove-light", light, index: 0 }).lights).toHaveLength(0);
    expect(applyWorldOperation(withLight, { type: "update-light", lightId: "l", from: { intensity: 2 }, to: { intensity: 5 } }).lights![0].intensity).toBe(5);
  });
  it("adds, removes and updates materials", () => {
    const initial = world(); const material = { color: "red", roughness: .5 };
    const withMaterial = applyWorldOperation(initial, { type: "add-material", meshId: "m", material });
    expect(withMaterial.meshes[0].material).toEqual(material);
    expect(applyWorldOperation(withMaterial, { type: "update-material", meshId: "m", from: material, to: { color: "blue" } }).meshes[0].material).toEqual({ color: "blue" });
    expect(applyWorldOperation(withMaterial, { type: "remove-material", meshId: "m", material }).meshes[0].material).toBeUndefined();
  });
  it("adds, removes and updates 3D animation tracks", () => {
    const initial = world(); const track = { id: "t", targetType: "mesh" as const, targetId: "m", property: "positionX" as const, keyframes: [] };
    const withTrack = applyWorldOperation(initial, { type: "add-3d-track", track });
    expect((withTrack as any).animationTracks).toHaveLength(1);
    const updated = applyWorldOperation(withTrack, { type: "update-3d-track", trackId: "t", from: { property: "positionX" }, to: { property: "positionY" } });
    expect((updated as any).animationTracks[0].property).toBe("positionY");
    expect((applyWorldOperation(updated, { type: "remove-3d-track", track, index: 0 }) as any).animationTracks).toHaveLength(0);
  });
  it("adds, removes, updates and moves 3D keyframes", () => {
    const initial = world(); const track = { id: "t", targetType: "mesh" as const, targetId: "m", property: "positionX" as const, keyframes: [] };
    let current = applyWorldOperation(initial, { type: "add-3d-track", track });
    const keyframe = { id: "k", time: 1, value: 10, easing: "linear" as const };
    current = applyWorldOperation(current, { type: "add-3d-keyframe", trackId: "t", keyframe });
    current = applyWorldOperation(current, { type: "update-3d-keyframe", trackId: "t", keyframeId: "k", from: { value: 10 }, to: { value: 20 } });
    expect((current as any).animationTracks[0].keyframes[0].value).toBe(20);
    current = applyWorldOperation(current, { type: "move-3d-keyframe", trackId: "t", keyframeId: "k", fromTime: 1, toTime: 3 });
    expect((current as any).animationTracks[0].keyframes[0].time).toBe(3);
    current = applyWorldOperation(current, { type: "remove-3d-keyframe", trackId: "t", keyframe, index: 0 });
    expect((current as any).animationTracks[0].keyframes).toHaveLength(0);
  });
  it("round-trips every representative operation through undo", () => {
    const initial = world();
    const operations: WorldOperation[] = [
      { type: "add-mesh", mesh: { ...initial.meshes[0], id: "m2" } },
      { type: "remove-mesh", mesh: initial.meshes[0], index: 0 },
      { type: "update-mesh", meshId: "m", from: { name: undefined }, to: { name: "Cube" } },
      { type: "add-camera", camera: { id: "c2", position: [0,0,0], rotation: [0,0,0], projection: "perspective" } },
      { type: "remove-camera", camera: initial.cameras[0], index: 0 },
      { type: "update-camera", cameraId: "c", from: {}, to: { name: "Main" } },
      { type: "add-light", light: { id: "l", type: "point" } },
      { type: "remove-light", light: { id: "l", type: "point" }, index: 0 },
      { type: "update-light", lightId: "l", from: { intensity: 1 }, to: { intensity: 2 } },
      { type: "add-material", meshId: "m", material: { color: "red" } },
      { type: "remove-material", meshId: "m", material: { color: "red" } },
      { type: "update-material", meshId: "m", from: { color: "red" }, to: { color: "blue" } },
      { type: "add-3d-track", track: { id: "t", targetType: "mesh", targetId: "m", property: "positionX", keyframes: [] } },
      { type: "add-3d-keyframe", trackId: "t", keyframe: { id: "k", time: 1, value: 1 } },
      { type: "update-3d-keyframe", trackId: "t", keyframeId: "k", from: { value: 1 }, to: { value: 2 } },
      { type: "move-3d-keyframe", trackId: "t", keyframeId: "k", fromTime: 1, toTime: 2 }
    ];
    for (const op of operations) expect(roundTrip(initial, op)).toEqual(initial);
    expect(invertWorldOperation(operations[0])).toEqual({ type: "remove-mesh", mesh: operations[0].mesh, index: 0 });
  });
});
