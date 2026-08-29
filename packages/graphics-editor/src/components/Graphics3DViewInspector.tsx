import type { Graphics3DView, Graphics3DWorld, WorldTimeMapping } from "../types";

export interface Graphics3DViewInspectorProps {
  view: Graphics3DView;
  worlds: Graphics3DWorld[];
  onChange: (patch: Partial<Omit<Graphics3DView, "id">>) => void;
  onEditWorld?: (worldId: string) => void;
}

export function Graphics3DViewInspector({ view, worlds, onChange, onEditWorld }: Graphics3DViewInspectorProps) {
  const world = worlds.find(item => item.id === view.worldId);
  const mapping: WorldTimeMapping = view.worldTime ?? { offset: 0, rate: 1 };
  const cameras = world?.cameras ?? [];
  const setMapping = (patch: Partial<WorldTimeMapping>) => onChange({ worldTime: { ...mapping, ...patch } });

  return <aside style={{ padding: 12, display: "grid", gap: 8, fontSize: 13 }}>
    <strong>3D View</strong>
    <label>World <select value={view.worldId} onChange={e => onChange({ worldId: e.target.value, cameraId: worlds.find(w => w.id === e.target.value)?.cameras[0]?.id ?? view.cameraId })}>
      {worlds.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}
    </select></label>
    <label>Camera <select value={view.cameraId} onChange={e => onChange({ cameraId: e.target.value })}>
      {cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.name ?? camera.id}</option>)}
    </select></label>
    {world && onEditWorld && <button onClick={() => onEditWorld(world.id)}>Edit World Animation</button>}
    <fieldset style={{ border: "1px solid #ccc", padding: 8 }}>
      <legend>World Time</legend>
      <label style={{ display: "block" }}>World time at view start <input type="number" step="0.1" value={mapping.offset} onChange={e => setMapping({ offset: Number(e.target.value) || 0 })} /></label>
      <label style={{ display: "block" }}>Speed <input type="number" step="0.1" value={mapping.rate} onChange={e => setMapping({ rate: Number(e.target.value) || 0 })} /> ×</label>
      <label style={{ display: "block" }}><input type="checkbox" checked={mapping.loop === "loop"} onChange={e => setMapping({ loop: e.target.checked ? "loop" : "none" })} /> Loop</label>
      <label style={{ display: "block" }}>In point <input type="number" min="0" step="0.1" value={mapping.inPoint ?? 0} onChange={e => setMapping({ inPoint: Number(e.target.value) || 0 })} /></label>
      <label style={{ display: "block" }}>Out point <input type="number" min="0" step="0.1" value={mapping.outPoint ?? ""} onChange={e => setMapping({ outPoint: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>
    </fieldset>
    <p style={{ margin: 0, opacity: .7 }}>The view is a window into the selected World. World animation is edited in the World; this view controls how it is sampled.</p>
  </aside>;
}
