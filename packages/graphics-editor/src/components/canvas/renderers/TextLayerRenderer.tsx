import type { CSSProperties } from "react";
import type { Layer } from "../../../types";
import { styleValue } from "../../../geometry";

export function TextLayerRenderer({ layer }: { layer: Layer }) {
  const text = layer.textStyle ?? {};
  const align = text.textAlign ?? styleValue(layer, "text-align", "left");
  const style: CSSProperties = {
    width: "100%", height: "100%", pointerEvents: "none",
    overflow: text.wrap === "none" ? "visible" : "hidden",
    display: "flex", flexDirection: "column",
    justifyContent: text.verticalAlign === "middle" ? "center" : text.verticalAlign === "bottom" ? "flex-end" : "flex-start",
    textAlign: align as CSSProperties["textAlign"],
    fontFamily: text.fontFamily ?? styleValue(layer, "font-family", "Arial, sans-serif"),
    fontSize: text.fontSize ?? Number.parseFloat(styleValue(layer, "font-size", "72")),
    fontWeight: text.fontWeight ?? styleValue(layer, "font-weight", "400"),
    fontStyle: text.fontStyle ?? "normal", lineHeight: text.lineHeight ?? 1.2,
    letterSpacing: text.letterSpacing ?? "0px", whiteSpace: text.whiteSpace ?? "pre-wrap",
    overflowWrap: text.wrap === "character" ? "anywhere" : "break-word",
    color: styleValue(layer, "color", "#fff"),
  };
  return <div style={style}>{layer.text}</div>;
}
