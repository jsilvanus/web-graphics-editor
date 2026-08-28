import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../types";

export type MeshEditMode = "object" | "vertices" | "faces";

export interface ThreeDMeshEditController {
  setMesh: (mesh: THREE.Mesh | undefined, data: Graphics3DMesh | undefined) => void;
  setMode: (mode: MeshEditMode) => void;
  dispose: () => void;
}

export function createThreeDMeshEditController(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, onChange: (geometry: Graphics3DMesh["geometry"]) => void): ThreeDMeshEditController {
  const handles = new THREE.Group();
  handles.name = "graphics3d-edit-handles";
  scene.add(handles);
  const transform = new TransformControls(camera, renderer.domElement);
  transform.setMode("translate");
  scene.add(transform.getHelper());
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let mesh: THREE.Mesh | undefined;
  let data: Graphics3DMesh | undefined;
  let mode: MeshEditMode = "object";
  let selectedVertex: number | null = null;
  let faceSelection: THREE.Mesh | undefined;
  let faceIndex: number | null = null;
  let suppress = false;

  const rebuildHandles = () => {
    while (handles.children.length) handles.remove(handles.children[0]);
    if (!mesh || !data || mode !== "vertices") return;
    const geometry = new THREE.SphereGeometry(0.075, 10, 6);
    for (let i = 0; i < data.geometry.vertices.length / 3; i++) {
      const handle = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: i === selectedVertex ? "#ffcc00" : "#ffffff" }));
      handle.position.fromArray(data.geometry.vertices, i * 3);
      handle.userData.vertexIndex = i;
      handles.add(handle);
    }
  };
  const clearFaceSelection = () => { if (faceSelection) { scene.remove(faceSelection); (faceSelection.material as THREE.Material).dispose(); faceSelection = undefined; } faceIndex = null; };
  const rebuildFaceSelection = () => {
    clearFaceSelection();
    if (!mesh || !data || mode !== "faces" || faceIndex == null) return;
    const positions = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.getIndex();
    const ids = index ? [index.getX(faceIndex * 3), index.getX(faceIndex * 3 + 1), index.getX(faceIndex * 3 + 2)] : [faceIndex * 3, faceIndex * 3 + 1, faceIndex * 3 + 2];
    const vertices = new Float32Array(ids.flatMap(i => [positions.getX(i), positions.getY(i), positions.getZ(i)]));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    faceSelection = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#ffcc00", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    faceSelection.renderOrder = 10;
    mesh.add(faceSelection);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!mesh || transform.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    if (mode === "vertices") {
      const hit = raycaster.intersectObjects(handles.children, false)[0];
      if (!hit) return;
      selectedVertex = hit.object.userData.vertexIndex as number;
      transform.attach(hit.object);
      rebuildHandles();
      return;
    }
    if (mode === "faces") {
      const hit = raycaster.intersectObject(mesh, false)[0];
      if (hit.faceIndex == null) return;
      faceIndex = hit.faceIndex;
      rebuildFaceSelection();
    }
  };
  const onObjectChange = () => {
    if (suppress || mode !== "vertices" || selectedVertex == null || !data) return;
    const handle = handles.children.find(child => child.userData.vertexIndex === selectedVertex);
    if (!handle) return;
    const vertices = [...data.geometry.vertices];
    vertices[selectedVertex * 3] = handle.position.x;
    vertices[selectedVertex * 3 + 1] = handle.position.y;
    vertices[selectedVertex * 3 + 2] = handle.position.z;
    suppress = true;
    onChange({ ...data.geometry, vertices });
    suppress = false;
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  transform.addEventListener("objectChange", onObjectChange);

  return {
    setMesh(nextMesh, nextData) {
      mesh = nextMesh; data = nextData;
      transform.detach(); selectedVertex = null; faceIndex = null; clearFaceSelection(); rebuildHandles();
    },
    setMode(nextMode) {
      mode = nextMode; transform.detach(); selectedVertex = null; faceIndex = null; clearFaceSelection(); rebuildHandles();
    },
    dispose() {
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      transform.removeEventListener("objectChange", onObjectChange);
      transform.detach(); transform.dispose(); scene.remove(transform.getHelper()); clearFaceSelection();
      for (const child of handles.children) { (child as THREE.Mesh).geometry.dispose(); ((child as THREE.Mesh).material as THREE.Material).dispose(); }
      scene.remove(handles);
    }
  };
}
