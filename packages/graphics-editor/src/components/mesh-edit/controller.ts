import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import { faceVertexIndices } from "../../3d-mesh-operations";
import { createHandleManager } from "./handles";
import { bevel, extrude, insetKernel, insetLegacy } from "./operations";
import { clearSelection, createSelection, selectedVertexIds } from "./selection";
import type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";

export function createMeshEditController(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, onChange: (geometry: Graphics3DMesh["geometry"]) => void): ThreeDMeshEditController {
  const transform = new TransformControls(camera, renderer.domElement); scene.add(transform.getHelper());
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), selection = createSelection();
  const state: { mesh?: THREE.Mesh; data?: Graphics3DMesh; mode: MeshEditMode } = { mode: "object" };
  const handles = createHandleManager(scene, selection, state);
  let dragSnapshot: number[] | null = null;

  const updateGeometry = (data: Graphics3DMesh) => { state.data = data; onChange(data.geometry); handles.rebuild(); };
  const onPointerDown = (event: PointerEvent) => {
    if (!state.mesh || !state.data || transform.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
    if (state.mode === "vertices") {
      const hit = raycaster.intersectObjects(handles.group.children.filter(o => o.userData.vertexIndex !== undefined), false)[0]; if (!hit) return;
      toggleSelection(selection.vertices, hit.object.userData.vertexIndex as number, event.shiftKey);
    } else if (state.mode === "edges") {
      const hit = raycaster.intersectObjects(handles.group.children, false)[0]; if (!hit) return;
      toggleSelection(selection.edges, String(hit.object.userData.edgeKey), event.shiftKey);
    } else if (state.mode === "faces") {
      const hit = raycaster.intersectObject(state.mesh, false)[0]; if (hit?.faceIndex == null) return;
      toggleSelection(selection.faces, hit.faceIndex, event.shiftKey);
    } else return;
    handles.rebuild(); dragSnapshot = [...state.data.geometry.vertices];
  };
  const onTransform = () => {
    if (!state.data || !dragSnapshot || state.mode === "object") return;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined; if (!pivot) return;
    const ids = selectedVertexIds(state.data, selection, state.mode); if (!ids.size) return;
    const center = new THREE.Vector3(); ids.forEach(id => center.add(new THREE.Vector3().fromArray(dragSnapshot!, id * 3))); center.multiplyScalar(1 / ids.size);
    const delta = pivot.position.clone().sub(center); if (delta.lengthSq() < 1e-10) return;
    const vertices = [...state.data.geometry.vertices]; ids.forEach(id => { vertices[id * 3] = dragSnapshot![id * 3] + delta.x; vertices[id * 3 + 1] = dragSnapshot![id * 3 + 1] + delta.y; vertices[id * 3 + 2] = dragSnapshot![id * 3 + 2] + delta.z; });
    state.data = { ...state.data, geometry: { ...state.data.geometry, vertices } }; onChange(state.data.geometry); dragSnapshot = vertices; pivot.position.copy(center).add(delta);
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown); transform.addEventListener("objectChange", onTransform);
  return {
    setMesh(mesh, data) { state.mesh = mesh; state.data = data; clearSelection(selection); dragSnapshot = null; handles.rebuild(); },
    updateData(data) { state.data = data; handles.rebuild(); },
    setMode(mode) { state.mode = mode; clearSelection(selection); dragSnapshot = null; transform.detach(); handles.rebuild(); },
    setFaceAction(_action: FaceEditAction) {},
    extrudeSelectedFace(distance) { if (!state.data || !selection.faces.size) return; updateGeometry(extrude(state.data, selection.faces, distance)); },
    insetSelectedFace(amount) { if (!state.data || !selection.faces.size) return; updateGeometry(insetKernel(state.data, selection.faces, amount)); },
    insetSelectedFaceLegacy(amount) { if (!state.data || !selection.faces.size) return; updateGeometry(insetLegacy(state.data, selection.faces, amount)); },
    bevelSelectedEdges(amount) { if (!state.data || !selection.edges.size) return; updateGeometry(bevel(state.data, selection.edges, amount)); },
    dispose() { renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("objectChange", onTransform); transform.detach(); transform.dispose(); handles.removePivot(); handles.clear(); scene.remove(handles.group); }
  };
}

function toggleSelection<T>(set: Set<T>, value: T, additive: boolean) { if (!additive) set.clear(); if (additive && set.has(value)) set.delete(value); else set.add(value); }

export type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";
