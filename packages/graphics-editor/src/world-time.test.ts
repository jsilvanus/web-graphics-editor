import { describe, expect, it } from "vitest";
import { mapWorldTime } from "./world-time";

describe("world time mapping", () => {
  it("applies offset and rate", () => {
    expect(mapWorldTime(0, { offset: 2, rate: 1 })).toBe(2);
    expect(mapWorldTime(3, { offset: 2, rate: 2 })).toBe(8);
  });
  it("supports slow motion and reverse playback", () => {
    expect(mapWorldTime(4, { offset: 1, rate: 0.5 })).toBe(3);
    expect(mapWorldTime(4, { offset: 10, rate: -1 })).toBe(6);
  });
  // World time is offset + t * rate, wrapped into [inPoint, outPoint) when looping
  // (docs/WORLD-TIME-MODEL.md). Times before inPoint wrap too, they are not shifted to start at it.
  it("loops inside the configured world range", () => {
    const m = { offset: 0, rate: 1, loop: true, inPoint: 2, outPoint: 6 };
    expect(mapWorldTime(2, m)).toBe(2);
    expect(mapWorldTime(3, m)).toBe(3);
    expect(mapWorldTime(6, m)).toBe(2);
    expect(mapWorldTime(7, m)).toBe(3);
    expect(mapWorldTime(0, m)).toBe(4);
  });
  it("loops correctly for negative mapped time", () =>
    expect(mapWorldTime(-1, { offset: 0, rate: 1, loop: true, inPoint: 2, outPoint: 6 })).toBe(3));
  it("does not loop without a valid range", () => {
    expect(mapWorldTime(10, { offset: 1, rate: 1, loop: true })).toBe(11);
    expect(mapWorldTime(10, { offset: 1, rate: 1, loop: true, inPoint: 5, outPoint: 5 })).toBe(11);
  });
});
