import { describe, expect, it } from "vitest";
import type { Graphics3DView, Graphics3DWorld } from "./types";
import { evaluateWorldAtTime } from "./world-animation";

const world: Graphics3DWorld = {
  id: "spinning-logo",
  meshes: [{ id: "logo", geometry: { vertices: [], indices: [] }, transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }],
  cameras: [{ id: "camera", position: [0, 0, 5], rotation: [0, 0, 0], projection: "perspective" }],
  timeline: { duration: 10, tracks: [{ id: "spin", targetType: "mesh", targetId: "logo", property: "rotationY", keyframes: [{ id: "a", time: 0, value: 0 }, { id: "b", time: 10, value: 360 }] }] }
};

const view = (worldTime: Graphics3DView["worldTime"]): Graphics3DView => ({ id: "view", worldId: world.id, cameraId: "camera", x: 0, y: 0, width: 100, height: 100, worldTime });

describe("3D view/world integration", () => {
  it("allows two views of the same world to observe different world times", () => {
    const viewA = view({ offset: 0, rate: 1 });
    const viewB = view({ offset: 2, rate: 0.5 });
    const a = evaluateWorldAtTime(world, 4, viewA.worldTime!);
    const b = evaluateWorldAtTime(world, 4, viewB.worldTime!);
    expect(a.worldTime).toBe(4);
    expect(b.worldTime).toBe(4);
    expect(a.meshes[0].transform.rotation[1]).toBe(144);
    expect(b.meshes[0].transform.rotation[1]).toBe(144);
  });

  it("permits independent mappings to produce different rendered states at the same WEGRA time", () => {
    const viewA = view({ offset: 0, rate: 1 });
    const viewB = view({ offset: 5, rate: 1 });
    const a = evaluateWorldAtTime(world, 2, viewA.worldTime!);
    const b = evaluateWorldAtTime(world, 2, viewB.worldTime!);
    expect(a.worldTime).toBe(2);
    expect(b.worldTime).toBe(7);
    expect(a.meshes[0].transform.rotation[1]).toBe(72);
    expect(b.meshes[0].transform.rotation[1]).toBe(252);
  });
});
