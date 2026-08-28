import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DWorld } from "../types";
import { createThreeGeometry } from "../3d-renderer";
import { makeWorkspaceCamera } from "../3d-workspace-camera";
import { updateWorldMesh } from "../3d-workspace-model";

export interface ThreeDWorkspaceViewportProps { world: Graphics3DWorld; cameraId: string; selectedId: string | null; mode: "translate" | "rotate" | "scale"; onModeChange: (mode: "translate" | "rotate" | "scale") => void; onSelect: (id: string | null) => void; onChange: (world: Graphics3DWorld) => void; }

export function ThreeDWorkspaceViewport({ world, cameraId, selectedId, mode, onModeChange, onSelect, onChange }: ThreeDWorkspaceViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null), objectsRef = useRef(new Map<string, THREE.Mesh>()), transformRef = useRef<TransformControls | null>(null), worldRef = useRef(world), selectedRef = useRef<string | null>(selectedId);
  worldRef.current = world; selectedRef.current = selectedId;

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current, renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#15171b"); scene.add(new THREE.GridHelper(20, 20), new THREE.AxesHelper(2)); scene.add(new THREE.AmbientLight("#ffffff", 1.1)); const key = new THREE.DirectionalLight("#ffffff", 2); key.position.set(5, 8, 6); scene.add(key);
    const active = worldRef.current.cameras.find(camera => camera.id === cameraId) ?? worldRef.current.cameras[0];
    if (!active) { renderer.dispose(); renderer.domElement.remove(); return; }
    const camera = makeWorkspaceCamera(active, (host.clientWidth || 800) / (host.clientHeight || 520)); const orbit = new OrbitControls(camera, renderer.domElement); orbit.enableDamping = true;
    const transform = new TransformControls(camera, renderer.domElement); transformRef.current = transform; scene.add(transform.getHelper());
    const sync = () => { const current = worldRef.current; for (const mesh of current.meshes) { let object = objectsRef.current.get(mesh.id); if (!object) { object = new THREE.Mesh(createThreeGeometry(mesh), new THREE.MeshStandardMaterial({ color: mesh.material?.color ?? "#78a9ff", roughness: mesh.material?.roughness ?? 0.75, metalness: mesh.material?.metalness ?? 0, wireframe: mesh.material?.wireframe ?? false })); object.name = mesh.name ?? mesh.id; object.userData.graphics3DId = mesh.id; scene.add(object); objectsRef.current.set(mesh.id, object); } object.position.set(...mesh.transform.position); object.rotation.set(...mesh.transform.rotation); object.scale.set(...mesh.transform.scale); } for (const [id, object] of objectsRef.current) if (!current.meshes.some(mesh => mesh.id === id)) { scene.remove(object); object.geometry.dispose(); (object.material as THREE.Material).dispose(); objectsRef.current.delete(id); } const selected = selectedRef.current ? objectsRef.current.get(selectedRef.current) : undefined; if (selected) transform.attach(selected); else transform.detach(); };
    sync();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => { if (transform.dragging) return; const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects([...objectsRef.current.values()])[0]; onSelect(hit?.object.userData.graphics3DId ?? null); };
    const onDrag = (event: { value: boolean }) => { orbit.enabled = !event.value; };
    const onObjectChange = () => { const id = selectedRef.current, object = id ? objectsRef.current.get(id) : undefined; if (!object || !id || !worldRef.current.meshes.some(mesh => mesh.id === id)) return; onChange(updateWorldMesh(worldRef.current, id, { transform: { position: object.position.toArray() as [number, number, number], rotation: object.rotation.toArray().slice(0, 3) as [number, number, number], scale: object.scale.toArray() as [number, number, number] } })); };
    renderer.domElement.addEventListener("pointerdown", onPointerDown); transform.addEventListener("dragging-changed", onDrag); transform.addEventListener("objectChange", onObjectChange);
    const resize = () => { const width = host.clientWidth || 1, height = host.clientHeight || 1; renderer.setSize(width, height, false); if (camera instanceof THREE.PerspectiveCamera) camera.aspect = width / height; camera.updateProjectionMatrix(); }; resize(); window.addEventListener("resize", resize);
    let frame = 0; const animate = () => { frame = requestAnimationFrame(animate); orbit.update(); renderer.render(scene, camera); }; animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("dragging-changed", onDrag); transform.removeEventListener("objectChange", onObjectChange); orbit.dispose(); transform.dispose(); transformRef.current = null; for (const object of objectsRef.current.values()) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } objectsRef.current.clear(); renderer.dispose(); renderer.domElement.remove(); };
  }, [cameraId, onChange, onSelect]);

  useEffect(() => { transformRef.current?.setMode(mode); }, [mode]);
  useEffect(() => { const object = selectedId ? objectsRef.current.get(selectedId) : undefined; if (object) transformRef.current?.attach(object); else transformRef.current?.detach(); }, [selectedId]);
  useEffect(() => { for (const mesh of world.meshes) { const object = objectsRef.current.get(mesh.id); if (object) { object.position.set(...mesh.transform.position); object.rotation.set(...mesh.transform.rotation); object.scale.set(...mesh.transform.scale); } } }, [world.meshes]);
  return <div ref={hostRef} style={{ minHeight: 520, position: "relative" }}><div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", gap: 6 }}><button onClick={() => onModeChange("translate")}>Move</button><button onClick={() => onModeChange("rotate")}>Rotate</button><button onClick={() => onModeChange("scale")}>Scale</button></div></div>;
}
