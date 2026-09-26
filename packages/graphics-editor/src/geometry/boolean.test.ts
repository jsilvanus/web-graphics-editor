import { describe, expect, it } from "vitest";
import { booleanContours, booleanPolygons, pathNodesToPolygon } from "./boolean";
const r = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];
const signedArea = (p: { x: number; y: number }[]) =>
  Math.abs(
    p.reduce((s, a, i) => {
      const b = p[(i + 1) % p.length];
      return s + a.x * b.y - a.y * b.x;
    }, 0) / 2,
  );
describe("polygon booleans", () => {
  it("intersects overlapping rectangles", () => {
    const out = booleanPolygons(r(0, 0, 10, 10), r(5, 5, 10, 10), "intersect");
    expect(out).toHaveLength(1);
    expect(signedArea(out[0])).toBe(25);
  });
  it("returns both disjoint polygons for union", () =>
    expect(booleanPolygons(r(0, 0, 10, 10), r(20, 0, 10, 10), "union")).toHaveLength(2));
  it("subtracts a contained polygon without returning the cutter", () =>
    expect(booleanPolygons(r(0, 0, 10, 10), r(2, 2, 2, 2), "subtract")).toHaveLength(1));
  it("flattens curved paths for boolean geometry", () => {
    const curve = [
      { x: 0, y: 0, kind: "smooth" as const, handleOut: { x: 0, y: 100 } },
      { x: 100, y: 100, kind: "smooth" as const, handleIn: { x: 100, y: 0 } },
      { x: 200, y: 0, kind: "smooth" as const, handleIn: { x: 200, y: 0 } },
    ];
    const polygon = pathNodesToPolygon(curve, true, 0.5);
    expect(polygon).not.toBeNull();
    expect(polygon!.length).toBeGreaterThan(3);
  });
  it("preserves a contained subtraction as an outer contour plus a hole", () => {
    const out = booleanContours(r(0, 0, 10, 10), r(2, 2, 2, 2), "subtract");
    expect(out).toHaveLength(2);
    expect(out.filter(c => !c.hole)).toHaveLength(1);
    expect(out.filter(c => c.hole)).toHaveLength(1);
  });
  it("keeps disjoint subtraction as the original subject only", () => {
    const out = booleanContours(r(0, 0, 10, 10), r(20, 0, 10, 10), "subtract");
    expect(out).toHaveLength(1);
    expect(out[0].hole).toBe(false);
  });
});
