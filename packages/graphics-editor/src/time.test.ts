import { describe, expect, it } from "vitest";
import { compositionTime, map3DViewTime, mapMediaTime } from "./time";

describe("time domains", () => {
  it("clamps and loops composition time", () => {
    expect(compositionTime(-1, { id: "c", name: "C", layerIds: [], duration: 5 })).toBe(0);
    expect(compositionTime(8, { id: "c", name: "C", layerIds: [], duration: 5, loop: true })).toBe(3);
    expect(compositionTime(8, { id: "c", name: "C", layerIds: [], duration: 5 })).toBe(5);
  });

  it("maps composition time into media time", () => {
    expect(mapMediaTime(2, { offset: 1, rate: 2 })).toBe(5);
    expect(mapMediaTime(7, { offset: 0, rate: 1, inPoint: 2, outPoint: 5 })).toBe(5);
    expect(mapMediaTime(7, { offset: 0, rate: 1, inPoint: 2, outPoint: 5, loop: true })).toBe(4);
  });

  it("maps composition time into 3D world time", () => {
    expect(
      map3DViewTime(4, {
        id: "v",
        worldId: "w",
        cameraId: "c",
        renderAssetId: "a",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        worldTime: { offset: 2, rate: 0.5 },
      }),
    ).toBe(4);
  });
});
