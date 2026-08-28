import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../types";
import { extrudeFace, faceVertexIndices, translateFace } from "../3d-mesh-operations";

export type MeshEditMode = "object" | "vertices" | "faces";
export type FaceEditAction = "translate" | "extrude";
export interface ThreeDMeshEditController {
  setMesh: (mesh: THREE.Mesh | undefined, data: Graphics3DMesh | undefined) => void;
  updateData: (data: Graphics3DMesh | undefined) => void;
  setMode: (mode: MeshEditMode) => void;
  setFaceAction: (action: FaceEditAction) => void;
  extrudeSelectedFace: (distance: number) => void;
  dispose: () => void;
}

export function createThreeDMeshEditController(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, onChange: (geometry: Graphics3DMesh["geometry"]) => void): ThreeDMeshEditController {
  const handles = new THREE.Group(); handles.name = "graphics3d-edit-handles"; scene.add(handles);
  const transform = new TransformControls(camera, renderer.domElement); transform.setMode("translate"); scene.add(transform.getHelper());
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let mesh: THREE.Mesh | undefined, data: Graphics3DMesh | undefined, mode: MeshEditMode = "object";
  let selectedVertices = new Set<number>(), selectedFaces = new Set<number>();
  let dragSnapshot: number[] | null = null;

  const clearGroup = () => { while (handles.children.length) { const child = handles.children.pop() as THREE.Object3D; child.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); if (Array.isArray(m.material)) m.material.forEach(x => x.dispose()); else if (m.material) (m.material as THREE.Material).dispose(); }); } };
  const removePivot = () => { const pivot = handles.userData.pivot as THREE.Object3D | undefined; if (pivot) { scene.remove(pivot); handles.userData.pivot = undefined; } };
  const createPivot = (position: THREE.Vector3) => { removePivot(); const pivot = new THREE.Group(); pivot.position.copy(position); pivot.userData.editPivot = true; handles.userData.pivot = pivot; scene.add(pivot); transform.attach(pivot); };
  const rebuildVertexHandles = () => {
    clearGroup(); removePivot(); if (!mesh || !data || mode !== "vertices") return;
    for (let i = 0; i < data.geometry.vertices.length / 3; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 6), new THREE.MeshBasicMaterial({ color: selectedVertices.has(i) ? "#ffcc00" : "#ffffff" })); h.position.fromArray(data.geometry.vertices, i * 3); h.userData.vertexIndex = i; handles.add(h); }
    if (selectedVertices.size) { const center = new THREE.Vector3(); selectedVertices.forEach(i => center.add(new THREE.Vector3().fromArray(data!.geometry.vertices, i * 3))); center.multiplyScalar(1 / selectedVertices.size); createPivot(center); }
  };
  const rebuildFaceHandles = () => {
    clearGroup(); removePivot(); if (!mesh || !data || mode !== "faces" || !selectedFaces.size) return;
    const positions = mesh.geometry.getAttribute("position"); const center = new THREE.Vector3(); let count = 0;
    selectedFaces.forEach(face => { const ids = faceVertexIndices(data!, face); if (!ids) return; const vertices = new Float32Array(ids.flatMap(i => [positions.getX(i), positions.getY(i), positions.getZ(i)])); const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3)); const h = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#ffcc00", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); h.renderOrder = 10; h.userData.faceIndex = face; handles.add(h); ids.forEach(i => { center.x += data!.geometry.vertices[i * 3]; center.y += data!.geometry.vertices[i * 3 + 1]; center.z += data!.geometry.vertices[i * 3 + 2]; count++; }); });
    if (count) { center.multiplyScalar(1 / count); createPivot(center); }
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!mesh || !data || transform.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
    if (mode === "vertices") { const hits = raycaster.intersectObjects(handles.children.filter(c => c.userData.vertexIndex !== undefined), false); const hit = hits[0]; if (!hit) return; const id = hit.object.userData.vertexIndex as number; if (event.shiftKey) { if (selectedVertices.has(id)) selectedVertices.delete(id); else selectedVertices.add(id); } else selectedVertices = new Set([id]); rebuildVertexHandles(); dragSnapshot = [...data.geometry.vertices]; return; }
    if (mode === "faces") { const hit = raycaster.intersectObject(mesh, false)[0]; if (hit?.faceIndex == null) return; const id = hit.faceIndex; if (event.shiftKey) { if (selectedFaces.has(id)) selectedFaces.delete(id); else selectedFaces.add(id); } else selectedFaces = new Set([id]); rebuildFaceHandles(); dragSnapshot = [...data.geometry.vertices]; }
  };
  const onObjectChange = () => {
    if (!data || !dragSnapshot) return; const pivot = handles.userData.pivot as THREE.Group | undefined; if (!pivot) return;
    const current = new THREE.Vector3(), original = new THREE.Vector3(); let count = 0;
    if (mode === "vertices") selectedVertices.forEach(i => { original.add(new THREE.Vector3().fromArray(dragSnapshot!, i * 3)); count++; });
    else if (mode === "faces") selectedFaces.forEach(face => faceVertexIndices(data!, face)?.forEach(i => { original.add(new THREE.Vector3().fromArray(dragSnapshot!, i * 3)); count++; }));
    if (!count) return; original.multiplyScalar(1 / count); current.copy(pivot.position); const delta = current.sub(original); if (delta.lengthSq() < 1e-10) return;
    const vertices = [...data.geometry.vertices]; if (mode === "vertices") selectedVertices.forEach(i => { vertices[i * 3] = dragSnapshot![i * 3] + delta.x; vertices[i * 3 + 1] = dragSnapshot![i * 3 + 1] + delta.y; vertices[i * 3 + 2] = dragSnapshot![i * 3 + 2] + delta.z; }); else { const ids = new Set<number>(); selectedFaces.forEach(face => faceVertexIndices(data!, face)?.forEach(i => ids.add(i))); ids.forEach(i => { vertices[i * 3] = dragSnapshot![i * 3] + delta.x; vertices[i * 3 + 1] = dragSnapshot![i * 3 + 1] + delta.y; vertices[i * 3 + 2] = dragSnapshot![i * 3 + 2] + delta.z; }); }
    onChange({ ...data.geometry, vertices }); data = { ...data, geometry: { ...data.geometry, vertices } }; dragSnapshot = vertices; pivot.position.copy(original).add(delta);
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown); transform.addEventListener("objectChange", onObjectChange);
  return {
    setMesh(nextMesh, nextData) { mesh = nextMesh; data = nextData; selectedVertices.clear(); selectedFaces.clear(); dragSnapshot = null; rebuildVertexHandles(); },
    updateData(nextData) { data = nextData; if (mode === "vertices") rebuildVertexHandles(); if (mode === "faces") rebuildFaceHandles(); },
    setMode(nextMode) { mode = nextMode; selectedVertices.clear(); selectedFaces.clear(); dragSnapshot = null; rebuildVertexHandles(); rebuildFaceHandles(); },
    setFaceAction() { /* reserved for future face tools */ },
    extrudeSelectedFace(distance) { if (!data || selectedFaces.size === 0) return; let next = data; [...selectedFaces].sort((a, b) => b - a).forEach(face => { next = extrudeFace(next, face, distance); }); data = next; onChange(next.geometry); rebuildFaceHandles(); },
    dispose() { renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("objectChange", onObjectChange); transform.detach(); transform.dispose(); removePivot(); clearGroup(); scene.remove(handles); }
  };
}
