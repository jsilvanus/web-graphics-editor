import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DWorld } from "./types";
import { createThreeGeometry } from "./3d-renderer";
import { add3DCamera, add3DLight, add3DMesh, remove3DMesh, update3DCamera, update3DMesh } from "./3d";
import { createBoxMesh } from "./3d-primitives";

export interface ThreeDWorkspaceProps {
  world: Graphics3DWorld;
  onChange: (world: Graphics3DWorld) => void;
  className?: string;
}

const DEFAULT_CAMERA: Graphics3DCamera = {
  id: "camera-main",
  name: "Main camera",
  position: [5, 4, 8],
  rotation: [0, 0, 0],
  projection: "perspective",
  fov: 50,
  near: 0.1,
  far: 2000,
};

function cameraObject(camera: Graphics3DCamera, aspect: number): THREE.Camera {
  if (camera.projection === "orthographic") {
    const h = 5 / (camera.zoom ?? 1);
    const w = h * aspect;
    const result = new THREE.OrthographicCamera(-w, w, h, -h, camera.near ?? 0.1, camera.far ?? 2000);
    result.position.set(...camera.position);
    result.rotation.set(...camera.rotation);
    return result;
  }
  const result = new THREE.PerspectiveCamera(camera.fov ?? 50, aspect, camera.near ?? 0.1, camera.far ?? 2000);
  result.position.set(...camera.position);
  result.rotation.set(...camera.rotation);
  return result;
}

function ensureWorld(world: Graphics3DWorld): Graphics3DWorld {
  if (world.cameras.length) return world;
  return { ...world, cameras: [DEFAULT_CAMERA] };
}

export function ThreeDWorkspace({ world: inputWorld, onChange, className }: ThreeDWorkspaceProps) {
  const world = ensureWorld(inputWorld);
  const hostRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(world.meshes[0]?.id ?? null);
  const [cameraId, setCameraId] = useState(world.cameras[0]?.id ?? DEFAULT_CAMERA.id);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");
  const worldRef = useRef(world);
  worldRef.current = world;

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 800, host.clientHeight || 500, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#15171b");
    scene.add(new THREE.GridHelper(20, 20));
    scene.add(new THREE.AxesHelper(2));

    const ambient = new THREE.AmbientLight("#ffffff", 1.2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#ffffff", 2);
    key.position.set(5, 8, 6);
    scene.add(key);

    let activeCamera = cameraObject(worldRef.current.cameras.find(c => c.id === cameraId) ?? worldRef.current.cameras[0], (host.clientWidth || 800) / (host.clientHeight || 500));
    const orbit = new OrbitControls(activeCamera, renderer.domElement);
    orbit.enableDamping = true;
    const transform = new TransformControls(activeCamera, renderer.domElement);
    transform.setMode(mode);
    transform.addEventListener("dragging-changed", event => { orbit.enabled = !(event.value as boolean); });
    scene.add(transform.getHelper());

    const objects = new Map<string, THREE.Mesh>();
    const rebuild = () => {
      for (const object of objects.values()) { scene.remove(object); object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach(m => m.dispose()); else object.material.dispose(); }
      objects.clear();
      for (const mesh of worldRef.current.meshes) {
        const object = new THREE.Mesh(createThreeGeometry(mesh), new THREE.MeshStandardMaterial({ color: mesh.material?.color ?? "#78a9ff", roughness: mesh.material?.roughness ?? 0.75, metalness: mesh.material?.metalness ?? 0, wireframe: mesh.material?.wireframe ?? false }));
        object.name = mesh.name ?? mesh.id;
        object.userData.graphics3DId = mesh.id;
        object.position.set(...mesh.transform.position);
        object.rotation.set(...mesh.transform.rotation);
        object.scale.set(...mesh.transform.scale);
        scene.add(object); objects.set(mesh.id, object);
      }
      const selected = selectedId ? objects.get(selectedId) : undefined;
      if (selected) transform.attach(selected); else transform.detach();
    };
    rebuild();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const select = (event: PointerEvent) => {
      if (transform.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, activeCamera);
      const hit = raycaster.intersectObjects([...objects.values()])[0];
      setSelectedId(hit?.object.userData.graphics3DId ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", select);

    const changed = () => {
      const id = selectedId;
      const object = id ? objects.get(id) : undefined;
      if (!object) return;
      const current = worldRef.current.meshes.find(m => m.id === id);
      if (!current) return;
      onChange(updateWorldMesh(worldRef.current, id, { transform: { position: object.position.toArray() as [number, number, number], rotation: object.rotation.toArray().slice(0, 3) as [number, number, number], scale: object.scale.toArray() as [number, number, number] } }));
    };
    transform.addEventListener("objectChange", changed);

    let frame = 0;
    const animate = () => { frame = requestAnimationFrame(animate); orbit.update(); renderer.render(scene, activeCamera); };
    animate();
    const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); if (activeCamera instanceof THREE.PerspectiveCamera) activeCamera.aspect = w / h; activeCamera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize);

    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.domElement.removeEventListener("pointerdown", select); transform.removeEventListener("objectChange", changed); orbit.dispose(); transform.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [cameraId]);

  useEffect(() => { if (!hostRef.current) return; }, [mode]);

  const addBox = () => {
    const id = `box-${Date.now()}`;
    const mesh = createBoxMesh(id, 2, 2, 2, { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
    onChange(add3DMesh(world, world.id, mesh).worlds3d?.find(w => w.id === world.id) ?? world);
    setSelectedId(id);
  };
  const removeSelected = () => { if (!selectedId) return; onChange(remove3DMesh({ worlds3d: [world], layers: [], width: 1, height: 1 }, world.id, selectedId).worlds3d![0]); setSelectedId(null); };
  const selected = world.meshes.find(m => m.id === selectedId);
  const activeCamera = world.cameras.find(c => c.id === cameraId) ?? world.cameras[0];
  const updateSelected = (patch: Partial<Graphics3DMesh>) => { if (!selected) return; onChange(updateWorldMesh(world, selected.id, patch)); };
  const updateCamera = (patch: Partial<Omit<Graphics3DCamera, "id">>) => { if (!activeCamera) return; onChange(updateWorldCamera(world, activeCamera.id, patch)); };
  const addCamera = () => { const id = `camera-${Date.now()}`; const camera: Graphics3DCamera = { ...DEFAULT_CAMERA, id, name: `Camera ${world.cameras.length + 1}` }; onChange({ ...world, cameras: [...world.cameras, camera] }); setCameraId(id); };
  const addLight = () => { const light: Graphics3DLight = { id: `light-${Date.now()}`, type: "directional", position: [4, 6, 4], intensity: 2 }; onChange({ ...world, lights: [...(world.lights ?? []), light] }); };

  return <div className={className} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", minHeight: 520, background: "#101216", color: "#eee", border: "1px solid #30343b", borderRadius: 8, overflow: "hidden" }}>
    <div ref={hostRef} style={{ minHeight: 520, position: "relative" }}><div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", gap: 6 }}><button onClick={() => setMode("translate")}>Move</button><button onClick={() => setMode("rotate")}>Rotate</button><button onClick={() => setMode("scale")}>Scale</button></div></div>
    <aside style={{ padding: 12, overflow: "auto", borderLeft: "1px solid #30343b", fontSize: 13 }}>
      <strong>{world.name ?? "3D World"}</strong>
      <div style={{ marginTop: 10, display: "flex", gap: 6 }}><button onClick={addBox}>+ Box</button><button onClick={removeSelected} disabled={!selectedId}>Delete</button></div>
      <h4>Objects</h4>
      {world.meshes.map(mesh => <button key={mesh.id} onClick={() => setSelectedId(mesh.id)} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 4, fontWeight: mesh.id === selectedId ? 700 : 400 }}>{mesh.name ?? mesh.id}</button>)}
      {selected && <><h4>Transform</h4><label>X <input type="number" value={selected.transform.position[0]} step="0.1" onChange={e => updateSelected({ transform: { ...selected.transform, position: [Number(e.target.value), selected.transform.position[1], selected.transform.position[2]] } })} /></label><label>Y <input type="number" value={selected.transform.position[1]} step="0.1" onChange={e => updateSelected({ transform: { ...selected.transform, position: [selected.transform.position[0], Number(e.target.value), selected.transform.position[2]] } })} /></label><label>Z <input type="number" value={selected.transform.position[2]} step="0.1" onChange={e => updateSelected({ transform: { ...selected.transform, position: [selected.transform.position[0], selected.transform.position[1], Number(e.target.value)] } })} /></label></>}
      <h4>Camera</h4><select value={activeCamera?.id ?? ""} onChange={e => setCameraId(e.target.value)}>{world.cameras.map(c => <option key={c.id} value={c.id}>{c.name ?? c.id}</option>)}</select> <button onClick={addCamera}>+</button><select value={activeCamera?.projection ?? "perspective"} onChange={e => updateCamera({ projection: e.target.value as Graphics3DCamera["projection"] })}><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select>
      {activeCamera && <><label>Camera X <input type="number" value={activeCamera.position[0]} step="0.1" onChange={e => updateCamera({ position: [Number(e.target.value), activeCamera.position[1], activeCamera.position[2]] })} /></label><label>Camera Y <input type="number" value={activeCamera.position[1]} step="0.1" onChange={e => updateCamera({ position: [activeCamera.position[0], Number(e.target.value), activeCamera.position[2]] })} /></label><label>Camera Z <input type="number" value={activeCamera.position[2]} step="0.1" onChange={e => updateCamera({ position: [activeCamera.position[0], activeCamera.position[1], Number(e.target.value)] })} /></label></>}
      <h4>Lights</h4><div>{(world.lights ?? []).length} lights <button onClick={addLight}>+ Light</button></div>
    </aside>
  </div>;
}

function updateWorldMesh(world: Graphics3DWorld, id: string, patch: Partial<Omit<Graphics3DMesh, "id">>): Graphics3DWorld { return { ...world, meshes: world.meshes.map(mesh => mesh.id === id ? { ...mesh, ...patch } : mesh) }; }
function updateWorldCamera(world: Graphics3DWorld, id: string, patch: Partial<Omit<Graphics3DCamera, "id">>): Graphics3DWorld { return { ...world, cameras: world.cameras.map(camera => camera.id === id ? { ...camera, ...patch } : camera) }; }
