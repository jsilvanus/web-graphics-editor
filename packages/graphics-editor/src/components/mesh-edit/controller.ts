import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../../types";
import { createHandleManager } from "./handles";
import { bevel, extrude, insetKernel, insetLegacy } from "./operations";
import { clearSelection, createSelection, selectedVertexIds } from "./selection";
import { moveVertices } from "../../mesh/move-vertices";
import { translateFaces } from "../../mesh/translate-faces";
import { weldVertices } from "../../mesh/weld-vertices";
import { deleteVertices } from "../../mesh/delete-vertices";
import type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";

export function createMeshEditController(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, onChange: (geometry: Graphics3DMesh["geometry"]) => void): ThreeDMeshEditController {
  const transform = new TransformControls(camera, renderer.domElement); scene.add(transform.getHelper());
  transform.setMode("translate");
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), selection = createSelection();
  const state: { mesh?: THREE.Mesh; data?: Graphics3DMesh; mode: MeshEditMode; faceAction: FaceEditAction } = { mode: "object", faceAction: "translate" };
  const handles = createHandleManager(scene, selection, state);
  let dragData: Graphics3DMesh | null = null;
  let dragOrigin: THREE.Vector3 | null = null;

  const syncTransform = () => {
    transform.detach();
    if (state.mode !== "faces" || state.faceAction !== "translate") return;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined;
    if (pivot && selection.faces.size) transform.attach(pivot);
  };
  const rebuild = () => { handles.rebuild(); syncTransform(); };
  const updateGeometry = (data: Graphics3DMesh) => { state.data = data; onChange(data.geometry); rebuild(); };
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
    rebuild();
    dragData = state.data;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined;
    dragOrigin = pivot ? pivot.position.clone() : null;
  };
  const onTransform = () => {
    if (!state.data || !dragData || state.mode === "object") return;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined;
    if (!pivot || !dragOrigin) return;
    const delta = pivot.position.clone().sub(dragOrigin);
    if (delta.lengthSq() < 1e-10) return;
    const ids = selectedVertexIds(dragData, selection, state.mode);
    if (!ids.size) return;
    const next = state.mode === "faces"
      ? translateFaces(dragData, selection.faces, [delta.x, delta.y, delta.z])
      : moveVertices(dragData, ids, [delta.x, delta.y, delta.z]);
    state.data = next;
    onChange(next.geometry);
  };
  const onTransformEnd = () => { dragData = null; dragOrigin = null; };
  renderer.domElement.addEventListener("pointerdown", onPointerDown); transform.addEventListener("objectChange", onTransform); transform.addEventListener("dragging-changed", onTransformDraggingChanged);
  function onTransformDraggingChanged(event: { value: boolean }) { if (!event.value) onTransformEnd(); }
  return {
    setMesh(mesh, data) { state.mesh = mesh; state.data = data; clearSelection(selection); dragData = null; dragOrigin = null; rebuild(); },
    updateData(data) { state.data = data; if (!transform.dragging) rebuild(); },
    setMode(mode) { state.mode = mode; clearSelection(selection); dragData = null; dragOrigin = null; rebuild(); },
    setFaceAction(action: FaceEditAction) { state.faceAction = action; if (action === "translate" && state.mode === "faces") rebuild(); else if (action !== "translate") transform.detach(); },
    moveSelectedVertices(delta) { if (!state.data) return; const ids = selectedVertexIds(state.data, selection, state.mode); if (!ids.size) return; updateGeometry(moveVertices(state.data, ids, delta)); },
    weldSelectedVertices(tolerance = 1e-6) { if (!state.data || state.mode !== "vertices") return; const ids = [...selection.vertices]; if (!ids.length) return; updateGeometry(weldVertices(state.data, ids, tolerance)); clearSelection(selection); dragData = null; dragOrigin = null; },
    deleteSelectedVertices() { if (!state.data || state.mode !== "vertices") return; const ids = [...selection.vertices]; if (!ids.length) return; updateGeometry(deleteVertices(state.data, ids)); clearSelection(selection); dragData = null; dragOrigin = null; },
    extrudeSelectedFace(distance) { if (!state.data || !selection.faces.size) return; updateGeometry(extrude(state.data, selection.faces, distance)); },
    insetSelectedFace(amount) { if (!state.data || !selection.faces.size) return; updateGeometry(insetKernel(state.data, selection.faces, amount)); },
    insetSelectedFaceLegacy(amount) { if (!state.data || !selection.faces.size) return; updateGeometry(insetLegacy(state.data, selection.faces, amount)); },
    bevelSelectedEdges(amount) { if (!state.data || !selection.edges.size) return; updateGeometry(bevel(state.data, selection.edges, amount)); },
    dispose() { renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("objectChange", onTransform); transform.removeEventListener("dragging-changed", onTransformDraggingChanged); transform.detach(); transform.dispose(); handles.removePivot(); handles.clear(); scene.remove(handles.group); }
  };
}

function toggleSelection<T>(set: Set<T>, value: T, additive: boolean) { if (!additive) set.clear(); if (additive && set.has(value)) set.delete(value); else set.add(value); }

export type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";
