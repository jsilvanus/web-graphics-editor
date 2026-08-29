import type { CSSProperties } from "react";
import type { Layer } from "../../../types";
import { styleValue } from "../../../geometry";

export function ShapeLayerRenderer({ layer }: { layer: Layer }) {
  const style: CSSProperties = { width: "100%", height: "100%", pointerEvents: "none" };
  if (layer.type === "ellipse") style.borderRadius = "50%";
  return <div style={style} />;
}

export function UnsupportedLayerRenderer({ layer }: { layer: Layer }) {
  return <div style={{ width: "100%", height: "100%", pointerEvents: "none", background: styleValue(layer, "background", "transparent") }} />;
}
