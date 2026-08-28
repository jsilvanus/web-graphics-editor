import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../types";
import { extrudeFace, faceNormal, faceVertexIndices, translateFace } from "../3d-mesh-operations";

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
  let selectedVertex: number | null = null, faceSelection: THREE.Mesh | undefined, faceIndex: number | null = null;
  let faceAction: FaceEditAction = "translate", faceStart: THREE.Vector3 | null = null;

  const rebuildHandles = () => {
    while (handles.children.length) { const child = handles.children.pop() as THREE.Mesh; child.geometry.dispose(); (child.material as THREE.Material).dispose(); }
    if (!mesh || !data || mode !== "vertices") return;
    for (let i = 0; i < data.geometry.vertices.length / 3; i++) {
      const handle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 6), new THREE.MeshBasicMaterial({ color: i === selectedVertex ? "#ffcc00" : "#ffffff" }));
      handle.position.fromArray(data.geometry.vertices, i * 3); handle.userData.vertexIndex = i; handles.add(handle);
    }
  };
  const clearFaceSelection = () => { if (faceSelection) { mesh?.remove(faceSelection); faceSelection.geometry.dispose(); (faceSelection.material as THREE.Material).dispose(); faceSelection = undefined; } faceIndex = null; faceStart = null; transform.detach(); };
  const rebuildFaceSelection = () => {
    if (faceSelection) { mesh?.remove(faceSelection); faceSelection.geometry.dispose(); (faceSelection.material as THREE.Material).dispose(); faceSelection = undefined; }
    if (!mesh || !data || mode !== "faces" || faceIndex == null) return;
    const positions = mesh.geometry.getAttribute("position"), index = mesh.geometry.getIndex();
    const ids = index ? [index.getX(faceIndex * 3), index.getX(faceIndex * 3 + 1), index.getX(faceIndex * 3 + 2)] : [faceIndex * 3, faceIndex * 3 + 1, faceIndex * 3 + 2];
    const vertices = new Float32Array(ids.flatMap(i => [positions.getX(i), positions.getY(i), positions.getZ(i)]));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    faceSelection = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#ffcc00", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); faceSelection.renderOrder = 10; mesh.add(faceSelection);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!mesh || transform.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
    if (mode === "vertices") { const hit = raycaster.intersectObjects(handles.children, false)[0]; if (!hit) return; selectedVertex = hit.object.userData.vertexIndex as number; transform.attach(hit.object); return; }
    if (mode !== "faces") return;
    const hit = raycaster.intersectObject(mesh, false)[0]; if (hit.faceIndex == null) return;
    faceIndex = hit.faceIndex; faceStart = null; rebuildFaceSelection();
    if (faceAction === "translate" && faceSelection) { transform.attach(faceSelection); faceSelection.position.set(0, 0, 0); faceStart = faceSelection.position.clone(); }
  };
  const onObjectChange = () => {
    if (!data) return;
    if (mode === "vertices" && selectedVertex != null) {
      const handle = handles.children.find(child => child.userData.vertexIndex === selectedVertex); if (!handle) return;
      const vertices = [...data.geometry.vertices]; vertices[selectedVertex * 3] = handle.position.x; vertices[selectedVertex * 3 + 1] = handle.position.y; vertices[selectedVertex * 3 + 2] = handle.position.z; onChange({ ...data.geometry, vertices }); return;
    }
    if (mode === "faces" && faceIndex != null && faceSelection && faceStart) {
      const delta: [number, number, number] = [faceSelection.position.x - faceStart.x, faceSelection.position.y - faceStart.y, faceSelection.position.z - faceStart.z];
      if (delta.some(v => Math.abs(v) > 1e-8)) { const next = translateFace(data, faceIndex, delta); onChange(next.geometry); faceStart.copy(faceSelection.position); }
    }
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown); transform.addEventListener("objectChange", onObjectChange);
  return {
    setMesh(nextMesh, nextData) { mesh = nextMesh; data = nextData; transform.detach(); selectedVertex = null; faceIndex = null; clearFaceSelection(); rebuildHandles(); },
    updateData(nextData) { data = nextData; rebuildHandles(); if (mode === "faces") rebuildFaceSelection(); },
    setMode(nextMode) { mode = nextMode; transform.detach(); selectedVertex = null; faceIndex = null; clearFaceSelection(); rebuildHandles(); },
    setFaceAction(action) { faceAction = action; transform.detach(); if (faceIndex != null) rebuildFaceSelection(); },
    extrudeSelectedFace(distance) { if (!data || faceIndex == null) return; const next = extrudeFace(data, faceIndex, distance); onChange(next.geometry); data = next; rebuildFaceSelection(); },
    dispose() { renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("objectChange", onObjectChange); transform.detach(); transform.dispose(); scene.remove(transform.getHelper()); clearFaceSelection(); while (handles.children.length) { const child = handles.children.pop() as THREE.Mesh; child.geometry.dispose(); (child.material as THREE.Material).dispose(); } scene.remove(handles); }
  };
}
