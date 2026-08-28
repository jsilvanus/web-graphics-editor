import { useState } from "react";
import type { MeshEditMode, ThreeDMeshEditController } from "./ThreeDMeshEditOverlay";

export interface ThreeDMeshEditControlsProps {
  mode: MeshEditMode;
  controller: ThreeDMeshEditController | null;
  disabled?: boolean;
}

export function ThreeDMeshEditControls({ mode, controller, disabled = false }: ThreeDMeshEditControlsProps) {
  const [distance, setDistance] = useState(0.5);
  if (mode !== "faces") return null;
  return <div style={{ position: "absolute", top: 42, left: 10, zIndex: 2, display: "flex", alignItems: "center", gap: 6, padding: 6, background: "rgba(16,18,22,.9)", border: "1px solid #30343b", borderRadius: 6 }}>
    <span style={{ fontSize: 12 }}>Face</span>
    <button disabled={disabled || !controller} onClick={() => controller?.setFaceAction("translate")}>Move</button>
    <label style={{ fontSize: 12 }}>Extrude <input aria-label="Extrusion distance" type="number" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value) || 0)} style={{ width: 64 }} /></label>
    <button disabled={disabled || !controller} onClick={() => controller?.extrudeSelectedFace(distance)}>Extrude</button>
  </div>;
}
