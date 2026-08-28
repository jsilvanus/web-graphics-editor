import { describe, expect, it } from "vitest";
import { linePath, orthogonalPoint, pathCommandsToD, roundedRectPath } from "./path";

describe("SVG path geometry", () => {
  it("serializes straight and curved commands", () => {
    expect(pathCommandsToD([{ type: "M", x: 1, y: 2 }, { type: "L", x: 3, y: 4 }, { type: "C", x1: 5, y1: 6, x2: 7, y2: 8, x: 9, y: 10 }, { type: "Z" }])).toBe("M 1 2 L 3 4 C 5 6 7 8 9 10 Z");
  });
  it("creates a line", () => expect(linePath(0, 2, 10, 12)).toBe("M 0 2 L 10 12"));
  it("constrains rounded corners by the narrowest dimension", () => expect(roundedRectPath(20, 200, 100)).toContain("A 10 10"));
  it("supports horizontal-first and vertical-first orthogonal segments", () => {
    expect(orthogonalPoint(10, 20, 50, 80, true)).toEqual({ x: 50, y: 20 });
    expect(orthogonalPoint(10, 20, 50, 80, false)).toEqual({ x: 10, y: 80 });
  });
});
