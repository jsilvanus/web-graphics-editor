import { describe, expect, it } from "vitest";
import { interpolateAnimationKeyframes } from "./timeline";

describe("typed animation interpolation", () => {
  it("interpolates opacity from 0 to 1", () => {
    expect(interpolateAnimationKeyframes([
      { id: "a", time: 0, value: 0 },
      { id: "b", time: 2, value: 1 },
    ], 1)).toBe(0.5);
  });
  it("supports independent simultaneous position and opacity tracks", () => {
    expect(interpolateAnimationKeyframes([{ id: "a", time: 0, value: 0 }, { id: "b", time: 4, value: 200 }], 2)).toBe(100);
    expect(interpolateAnimationKeyframes([{ id: "a", time: 0, value: 1 }, { id: "b", time: 2, value: 0 }], 1)).toBe(0.5);
  });
  it("interpolates hex colors", () => {
    expect(interpolateAnimationKeyframes([
      { id: "a", time: 0, value: "#ff0000" },
      { id: "b", time: 2, value: "#000000" },
    ], 1)).toBe("#800000");
  });
  it("keeps booleans and non-color strings discrete", () => {
    expect(interpolateAnimationKeyframes([{ id: "a", time: 0, value: false }, { id: "b", time: 1, value: true }], .5)).toBe(false);
    expect(interpolateAnimationKeyframes([{ id: "a", time: 0, value: "red" }, { id: "b", time: 1, value: "black" }], .5)).toBe("red");
  });
  it("interpolates numeric tuples", () => {
    expect(interpolateAnimationKeyframes([{ id: "a", time: 0, value: [0, 10, 20] }, { id: "b", time: 2, value: [10, 20, 30] }], 1)).toEqual([5, 15, 25]);
  });
  it("honors discrete interpolation", () => {
    expect(interpolateAnimationKeyframes([
      { id: "a", time: 0, value: 0, interpolation: { mode: "discrete" } },
      { id: "b", time: 2, value: 1 },
    ], 1)).toBe(0);
  });
  it("honors outgoing easing", () => {
    expect(interpolateAnimationKeyframes([
      { id: "a", time: 0, value: 0, interpolation: { easing: { mode: "ease-in" } } },
      { id: "b", time: 2, value: 100 },
    ], 1)).toBe(25);
  });
});
