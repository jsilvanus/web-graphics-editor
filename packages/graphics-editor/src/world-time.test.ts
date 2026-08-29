import { describe, expect, it } from "vitest";
import { mapWorldTime } from "./world-time";

describe("mapWorldTime", () => {
  it("maps main timeline time using offset and rate", () => {
    expect(mapWorldTime(0, { offset: 2, rate: 1 })).toBe(2);
    expect(mapWorldTime(3, { offset: 2, rate: 2 })).toBe(8);
  });

  it("supports slow motion and reverse playback", () => {
    expect(mapWorldTime(4, { offset: 1, rate: 0.5 })).toBe(3);
    expect(mapWorldTime(4, { offset: 10, rate: -1 })).toBe(6);
  });

  it("loops inside the configured world range", () => {
    const mapping = { offset: 0, rate: 1, loop: "loop" as const, inPoint: 2, outPoint: 6 };
    expect(mapWorldTime(0, mapping)).toBe(2);
    expect(mapWorldTime(1, mapping)).toBe(3);
    expect(mapWorldTime(4, mapping)).toBe(2);
    expect(mapWorldTime(5, mapping)).toBe(3);
  });

  it("loops correctly for negative mapped time", () => {
    const mapping = { offset: 0, rate: 1, loop: "loop" as const, inPoint: 2, outPoint: 6 };
    expect(mapWorldTime(-1, mapping)).toBe(5);
  });

  it("does not loop without a valid range", () => {
    expect(mapWorldTime(10, { offset: 1, rate: 1, loop: "loop" })).toBe(11);
    expect(mapWorldTime(10, { offset: 1, rate: 1, loop: "loop", inPoint: 5, outPoint: 5 })).toBe(11);
  });
});
