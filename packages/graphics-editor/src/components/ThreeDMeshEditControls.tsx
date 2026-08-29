import { useState } from "react";
import type { MeshEditMode, ThreeDMeshEditController } from "./ThreeDMeshEditOverlay";

export interface ThreeDMeshEditControlsProps {
  mode: MeshEditMode;
  controller: ThreeDMeshEditController | null;
  disabled?: boolean;
}

export function ThreeDMeshEditControls({ mode, controller, disabled = false }: ThreeDMeshEditControlsProps) {
  const [distance, setDistance] = useState(0.5);
  const [weldTolerance, setWeldTolerance] = useState(0.05);
  if (mode === "object") return null;

  return <div style={{ position: "absolute", top: 42, left: 10, zIndex: 2, display: "flex", alignItems: "center", gap: 6, padding: 6, background: "rgba(16,18,22,.9)", border: "1px solid #30343b", borderRadius: 6 }}>
    {mode === "vertices" && <>
      <span style={{ fontSize: 12 }}>Vertex</span>
      <button disabled={disabled || !controller} onClick={() => controller?.moveSelectedVertices([0, distance, 0])}>Move +Y</button>
      <label style={{ fontSize: 12 }}>Step <input aria-label="Vertex move step" type="number" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value) || 0)} style={{ width: 64 }} /></label>
      <button disabled={disabled || !controller} onClick={() => controller?.weldSelectedVertices(weldTolerance)}>Weld</button>
      <label style={{ fontSize: 12 }}>Tol. <input aria-label="Weld tolerance" type="number" min="0" step="0.01" value={weldTolerance} onChange={event => setWeldTolerance(Number(event.target.value) || 0)} style={{ width: 56 }} /></label>
      <button disabled={disabled || !controller} onClick={() => controller?.deleteSelectedVertices()}>Delete</button>
    </>}
    {mode === "edges" && <>
      <span style={{ fontSize: 12 }}>Edge</span>
      <label style={{ fontSize: 12 }}>Amount <input aria-label="Edge operation amount" type="number" min="0" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value) || 0)} style={{ width: 64 }} /></label>
      <button disabled={disabled || !controller} onClick={() => controller?.bevelSelectedEdges(distance)}>Bevel</button>
    </>}
    {mode === "faces" && <>
      <span style={{ fontSize: 12 }}>Face</span>
      <label style={{ fontSize: 12 }}>Amount <input aria-label="Face operation amount" type="number" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value) || 0)} style={{ width: 64 }} /></label>
      <button disabled={disabled || !controller} onClick={() => controller?.setFaceAction("translate")}>Move</button>
      <button disabled={disabled || !controller} onClick={() => controller?.extrudeSelectedFace(distance)}>Extrude</button>
      <button disabled={disabled || !controller} onClick={() => controller?.insetSelectedFace(distance)}>Inset</button>
    </>}
  </div>;
}
