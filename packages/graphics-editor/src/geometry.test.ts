import { describe, expect, it } from "vitest";
import { layerStyle } from "./geometry";
import type { Layer } from "./types";

const layer: Layer = {
  id: "shape",
  type: "rectangle",
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  rotation: 12,
  style: {
    background: "#123456",
    opacity: 0.5,
    "box-shadow": "0 4px 12px #0008",
    border: "2px solid white",
  },
};

describe("layer rendering style", () => {
  it("maps document geometry and transforms to CSS", () => {
    expect(layerStyle(layer, false)).toMatchObject({
      position: "absolute",
      left: 10,
      top: 20,
      width: 100,
      height: 50,
      transform: "rotate(12deg)",
      boxSizing: "border-box",
    });
  });

  it("preserves visual style properties", () => {
    expect(layerStyle(layer, false)).toMatchObject({
      background: "#123456",
      opacity: 0.5,
      boxShadow: "0 4px 12px #0008",
      border: "2px solid white",
    });
  });

  it("converts a document gradient into CSS backgroundImage", () => {
    const gradientLayer: Layer = {
      ...layer,
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { offset: 0, color: "#000" },
          { offset: 1, color: "#fff" },
        ],
      },
    };
    expect(layerStyle(gradientLayer, false).backgroundImage).toContain("linear-gradient");
  });

  it("adds the selection outline without replacing visual styling", () => {
    expect(layerStyle(layer, true)).toMatchObject({
      outline: "3px solid #38bdf8",
      background: "#123456",
      opacity: 0.5,
    });
  });
});
