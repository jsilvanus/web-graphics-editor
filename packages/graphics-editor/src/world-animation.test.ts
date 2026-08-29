import { describe, expect, it } from "vitest";
import type { Graphics3DWorld } from "./types";
import { evaluateWorldAtTime } from "./world-animation";

const world: Graphics3DWorld = {
  id: "logo", meshes: [{ id: "logo-mesh", geometry: { vertices: [], indices: [] }, transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } }], cameras: [{ id: "camera", position: [0,0,5], rotation: [0,0,0], projection: "perspective", fov: 60 }], timeline: { duration: 10, tracks: [
    { id: "rx", targetType: "mesh", targetId: "logo-mesh", property: "rotationY", keyframes: [{ id: "a", time: 0, value: 0 }, { id: "b", time: 10, value: 360 }] },
    { id: "fov", targetType: "camera", targetId: "camera", property: "fov", keyframes: [{ id: "c", time: 0, value: 60 }, { id: "d", time: 10, value: 90 }] }
  ] }
};

describe("evaluateWorldAtTime", () => {
  it("evaluates intrinsic world animation at mapped world time", () => {
    const result = evaluateWorldAtTime(world, 2, { offset: 0, rate: 1 });
    expect(result.worldTime).toBe(2);
    expect(result.meshes[0].transform.rotation[1]).toBe(72);
    expect(result.cameras[0].fov).toBe(66);
  });
  it("uses the view's offset and playback rate", () => {
    const result = evaluateWorldAtTime(world, 2, { offset: 1, rate: 2 });
    expect(result.worldTime).toBe(5);
    expect(result.meshes[0].transform.rotation[1]).toBe(180);
  });
  it("evaluates a looped world through mapped time", () => {
    const result = evaluateWorldAtTime(world, 12, { offset: 0, rate: 1, loop: "loop", inPoint: 0, outPoint: 10 });
    expect(result.worldTime).toBe(2);
    expect(result.meshes[0].transform.rotation[1]).toBe(72);
  });
});
