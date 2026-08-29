import type { Layer } from "../../../types";
import { styleValue } from "../../../geometry";

export function ImageLayerRenderer({ layer }: { layer: Layer }) {
  return <img src={layer.src || ""} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: styleValue(layer, "object-fit", "contain") as React.CSSProperties["objectFit"], pointerEvents: "none", display: "block" }} />;
}
