import { useCallback, useState } from "react";
import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DWorld } from "./types";
import { createBoxMesh } from "./3d-primitives";
import { DEFAULT_CAMERA } from "./3d-workspace-camera";
import { updateWorldCamera, updateWorldMesh } from "./3d-workspace-model";
import { ThreeDWorkspaceViewport } from "./components/ThreeDWorkspaceViewport";
import { ThreeDWorkspaceInspector } from "./components/ThreeDWorkspaceInspector";

export interface ThreeDWorkspaceProps {
  world: Graphics3DWorld;
  onChange: (world: Graphics3DWorld) => void;
  className?: string;
}

export function ThreeDWorkspace({ world: inputWorld, onChange, className }: ThreeDWorkspaceProps) {
  const world = inputWorld.cameras.length ? inputWorld : { ...inputWorld, cameras: [DEFAULT_CAMERA] };
  const [selectedId, setSelectedId] = useState<string | null>(world.meshes[0]?.id ?? null);
  const [cameraId, setCameraId] = useState(world.cameras[0]?.id ?? DEFAULT_CAMERA.id);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");

  const updateMesh = useCallback((id: string, patch: Partial<Omit<Graphics3DMesh, "id">>) => onChange(updateWorldMesh(world, id, patch)), [onChange, world]);
  const updateCamera = useCallback((id: string, patch: Partial<Omit<Graphics3DCamera, "id">>) => onChange(updateWorldCamera(world, id, patch)), [onChange, world]);
  const addBox = useCallback(() => {
    const id = `box-${Date.now()}`;
    onChange({ ...world, meshes: [...world.meshes, createBoxMesh(id, 2, 2, 2, { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] })] });
    setSelectedId(id);
  }, [onChange, world]);
  const deleteMesh = useCallback(() => {
    if (!selectedId) return;
    onChange({ ...world, meshes: world.meshes.filter(mesh => mesh.id !== selectedId) });
    setSelectedId(null);
  }, [onChange, selectedId, world]);
  const addCamera = useCallback(() => {
    const id = `camera-${Date.now()}`;
    onChange({ ...world, cameras: [...world.cameras, { ...DEFAULT_CAMERA, id, name: `Camera ${world.cameras.length + 1}` }] });
    setCameraId(id);
  }, [onChange, world]);
  const addLight = useCallback(() => {
    const light: Graphics3DLight = { id: `light-${Date.now()}`, type: "directional", position: [4, 6, 4], intensity: 2 };
    onChange({ ...world, lights: [...(world.lights ?? []), light] });
  }, [onChange, world]);

  return <div className={className} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", minHeight: 520, background: "#101216", color: "#eee", border: "1px solid #30343b", borderRadius: 8, overflow: "hidden" }}>
    <ThreeDWorkspaceViewport world={world} cameraId={cameraId} selectedId={selectedId} mode={mode} onSelect={setSelectedId} onChange={onChange} />
    <ThreeDWorkspaceInspector world={world} selectedId={selectedId} cameraId={cameraId} onSelect={setSelectedId} onUpdateMesh={updateMesh} onUpdateCamera={updateCamera} onAddBox={addBox} onDeleteMesh={deleteMesh} onCameraChange={setCameraId} onAddCamera={addCamera} onAddLight={addLight} />
    <div style={{ position: "absolute", display: "none" }} aria-hidden="true">{mode}</div>
  </div>;
}
