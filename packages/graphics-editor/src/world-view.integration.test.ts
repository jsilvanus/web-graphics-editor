import { describe, expect, it } from "vitest";
import type { Graphics3DWorld } from "./types";
import { evaluateWorldAtTime } from "./world-animation";

const sharedWorld: Graphics3DWorld = {
  id: "spinning-logo", meshes: [{ id: "logo", geometry: { vertices: [], indices: [] }, transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } }], cameras: [{ id: "main", position: [0,0,5], rotation: [0,0,0], projection: "perspective" }],
  timeline: { duration: 10, tracks: [{ id: "spin", targetType: "mesh", targetId: "logo", property: "rotationY", keyframes: [{ id: "a", time: 0, value: 0 }, { id: "b", time: 10, value: 360 }] }] }
};

describe("shared 3D world view integration", () => {
  it("allows two views of the same world to observe different world times", () => {
    const viewA = evaluateWorldAtTime(sharedWorld, 2, { offset: 0, rate: 1 });
    const viewB = evaluateWorldAtTime(sharedWorld, 2, { offset: 5, rate: 0.5 });
    expect(viewA.worldTime).toBe(2);
    expect(viewB.worldTime).toBe(6);
    expect(viewA.meshes[0].transform.rotation[1]).toBe(72);
    expect(viewB.meshes[0].transform.rotation[1]).toBe(216);
    expect(sharedWorld.meshes[0].transform.rotation[1]).toBe(0);
  });
});
