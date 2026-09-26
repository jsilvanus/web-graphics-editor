import type { CSSProperties } from "react";
import type { Layer } from "../../../types";
import { styleValue } from "../../../geometry";

export function ShapeLayerRenderer({ layer }: { layer: Layer }) {
  const style: CSSProperties = {
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    boxSizing: "border-box",
    background: styleValue(layer, "background", styleValue(layer, "fill", "transparent")),
    opacity: Number(layer.opacity ?? styleValue(layer, "opacity", 1)),
  };
  const borderWidth = Number(styleValue(layer, "border-width", 0));
  const borderColor = styleValue(layer, "border-color", styleValue(layer, "stroke", "transparent"));
  if (borderWidth > 0) style.border = String(borderWidth) + "px solid " + String(borderColor);
  if (layer.type === "ellipse") style.borderRadius = "50%";
  else {
    const radius = styleValue(layer, "border-radius", 0);
    style.borderRadius = typeof radius === "number" ? String(radius) + "px" : String(radius);
  }
  return <div style={style} />;
}

export function UnsupportedLayerRenderer({ layer }: { layer: Layer }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        background: styleValue(layer, "background", "transparent"),
      }}
    />
  );
}
