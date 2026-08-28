import type { Graphics3DCamera, Graphics3DMesh, Graphics3DWorld } from "../types";

export interface ThreeDWorkspaceInspectorProps {
  world: Graphics3DWorld;
  selectedId: string | null;
  cameraId: string;
  editCamera: boolean;
  onEditCamera: (editing: boolean) => void;
  onSelect: (id: string | null) => void;
  onUpdateMesh: (id: string, patch: Partial<Omit<Graphics3DMesh, "id">>) => void;
  onUpdateCamera: (id: string, patch: Partial<Omit<Graphics3DCamera, "id">>) => void;
  onAddBox: () => void;
  onDeleteMesh: () => void;
  onCameraChange: (id: string) => void;
  onAddCamera: () => void;
  onAddLight: () => void;
}

export function ThreeDWorkspaceInspector({ world, selectedId, cameraId, editCamera, onEditCamera, onSelect, onUpdateMesh, onUpdateCamera, onAddBox, onDeleteMesh, onCameraChange, onAddCamera, onAddLight }: ThreeDWorkspaceInspectorProps) {
  const selected = world.meshes.find(mesh => mesh.id === selectedId);
  const camera = world.cameras.find(item => item.id === cameraId) ?? world.cameras[0];
  return <aside style={{ padding: 12, overflow: "auto", borderLeft: "1px solid #30343b", fontSize: 13 }}>
    <strong>{world.name ?? "3D World"}</strong>
    <div style={{ marginTop: 10, display: "flex", gap: 6 }}><button onClick={onAddBox}>+ Box</button><button onClick={onDeleteMesh} disabled={!selectedId}>Delete</button></div>
    <h4>Objects</h4>
    {world.meshes.map(mesh => <button key={mesh.id} onClick={() => { onEditCamera(false); onSelect(mesh.id); }} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 4, fontWeight: mesh.id === selectedId ? 700 : 400 }}>{mesh.name ?? mesh.id}</button>)}
    {selected && <><h4>Transform</h4>{(["x", "y", "z"] as const).map((axis, i) => <label key={axis} style={{ display: "block" }}>{axis.toUpperCase()} <input type="number" step="0.1" value={selected.transform.position[i]} onChange={event => { const position = [...selected.transform.position] as [number, number, number]; position[i] = Number(event.target.value); onUpdateMesh(selected.id, { transform: { ...selected.transform, position } }); }} /></label>)}</>}
    <h4>Camera</h4>
    <div><select value={camera?.id ?? ""} onChange={event => { onCameraChange(event.target.value); onEditCamera(true); }}>{world.cameras.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</select> <button onClick={onAddCamera}>+</button></div>
    {camera && <><button style={{ marginTop: 6 }} onClick={() => onEditCamera(!editCamera)}>{editCamera ? "Stop editing camera" : "Edit camera in viewport"}</button><select value={camera.projection} onChange={event => onUpdateCamera(camera.id, { projection: event.target.value as Graphics3DCamera["projection"] })}><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select>{(["x", "y", "z"] as const).map((axis, i) => <label key={axis} style={{ display: "block" }}>Cam {axis.toUpperCase()} <input type="number" step="0.1" value={camera.position[i]} onChange={event => { const position = [...camera.position] as [number, number, number]; position[i] = Number(event.target.value); onUpdateCamera(camera.id, { position }); }} /></label>)}</>}
    <h4>Lights</h4><div>{(world.lights ?? []).length} lights <button onClick={onAddLight}>+ Light</button></div>
  </aside>;
}
