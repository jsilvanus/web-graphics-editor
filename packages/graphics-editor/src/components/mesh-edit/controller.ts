import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../../types";
import { createHandleManager } from "./handles";
import { bevel, connectEdges, extrude, flipMeshFaces, insetKernel, insetLegacy, recalculateMeshNormals, splitEdges } from "./operations";
import { clearSelection, createSelection, growFaceSelection as growSelection, selectedVertexIds, selectEdgeLoop, selectEdgeRing, shrinkFaceSelection as shrinkSelection } from "./selection";
import { addVertex } from "../../mesh/add-vertex";
import { addGraphicsMeshFace, deleteGraphicsMeshFace } from "../../mesh/graphics-mesh-faces";
import { moveVertices } from "../../mesh/move-vertices";
import { scaleVertices } from "../../mesh/scale-vertices";
import { duplicateFaces, extractFaces } from "../../mesh/extract-faces";
import { translateFaces } from "../../mesh/translate-faces";
import { weldVertices } from "../../mesh/weld-vertices";
import { deleteVertices } from "../../mesh/delete-vertices";
import { cloneMeshEditState, sameGeometry, snapshotMeshEditState, type MeshEditHistoryState } from "./history";
import type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";

const MAX_HISTORY = 100;

export function createMeshEditController(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, onChange: (geometry: Graphics3DMesh["geometry"]) => void): ThreeDMeshEditController {
  const transform = new TransformControls(camera, renderer.domElement); scene.add(transform.getHelper());
  transform.setMode("translate");
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), selection = createSelection();
  const state: { mesh?: THREE.Mesh; data?: Graphics3DMesh; mode: MeshEditMode; faceAction: FaceEditAction } = { mode: "object", faceAction: "translate" };
  const handles = createHandleManager(scene, selection, state);
  const past: MeshEditHistoryState[] = [];
  const future: MeshEditHistoryState[] = [];
  const historyListeners = new Set<() => void>();
  const notifyHistory = () => { for (const listener of historyListeners) listener(); };
  let dragData: Graphics3DMesh | null = null;
  let dragOrigin: THREE.Vector3 | null = null;
  let dragScaleOrigin: THREE.Vector3 | null = null;

  const rebuild = () => { handles.rebuild(); syncTransform(); };
  const syncTransform = () => {
    transform.detach();
    if (state.mode === "faces" && ["translate", "extrude", "scale", "inset"].includes(state.faceAction)) {
      transform.setMode(state.faceAction === "scale" ? "scale" : "translate");
      transform.setSpace(state.faceAction === "translate" ? "world" : "local");
    } else if (state.mode === "edges" && state.faceAction === "bevel") {
      transform.setMode("translate");
      transform.setSpace("world");
    } else return;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined;
    if (pivot && selection.faces.size) transform.attach(pivot);
  };

  const currentSnapshot = () => state.data
    ? snapshotMeshEditState(state.data, state.mode, state.faceAction, selection)
    : null;

  const pushHistory = (before: MeshEditHistoryState | null) => {
    if (!before || !state.data || sameGeometry(before.data, state.data)) return;
    past.push(before);
    if (past.length > MAX_HISTORY) past.shift();
    future.length = 0;
    notifyHistory();
  };

  const updateGeometry = (data: Graphics3DMesh, before: MeshEditHistoryState | null = currentSnapshot()) => {
    state.data = data;
    pushHistory(before);
    onChange(data.geometry);
    rebuild();
  };

  const restore = (snapshot: MeshEditHistoryState) => {
    state.data = cloneMeshEditState(snapshot).data;
    state.mode = snapshot.mode;
    state.faceAction = snapshot.faceAction;
    selection.vertices = new Set(snapshot.selection.vertices);
    selection.edges = new Set(snapshot.selection.edges);
    selection.faces = new Set(snapshot.selection.faces);
    dragData = null;
    dragOrigin = null;
    dragScaleOrigin = null;
    onChange(state.data.geometry);
    rebuild();
    notifyHistory();
  };

  const undo = () => {
    const target = past.pop();
    if (!target || !state.data) return;
    future.push(currentSnapshot()!);
    restore(target);
  };

  const redo = () => {
    const target = future.pop();
    if (!target || !state.data) return;
    past.push(currentSnapshot()!);
    restore(target);
  };

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
    dragScaleOrigin = pivot ? pivot.scale.clone() : null;
  };

  const onTransform = () => {
    if (!state.data || !dragData || state.mode === "object") return;
    const pivot = handles.group.userData.pivot as THREE.Group | undefined;
    if (!pivot) return;

    if (state.mode === "faces" && state.faceAction === "inset" && dragOrigin) {
      const delta = pivot.position.clone().sub(dragOrigin);
      const amount = delta.length();
      state.data = insetKernel(dragData, selection.faces, amount);
      onChange(state.data.geometry);
      return;
    }

    if (state.mode === "edges" && state.faceAction === "bevel" && dragOrigin) {
      const delta = pivot.position.clone().sub(dragOrigin);
      const amount = delta.length();
      state.data = bevel(dragData, selection.edges, amount);
      onChange(state.data.geometry);
      return;
    }

    if (state.mode === "faces" && state.faceAction === "scale" && dragScaleOrigin) {
      const scale = new THREE.Vector3(
        pivot.scale.x / dragScaleOrigin.x,
        pivot.scale.y / dragScaleOrigin.y,
        pivot.scale.z / dragScaleOrigin.z,
      );
      const ids = selectedVertexIds(dragData, selection, state.mode);
      const orientation = pivot.quaternion.clone();
      state.data = scaleVertices(dragData, ids, pivot.position, orientation, scale);
      onChange(state.data.geometry);
      return;
    }

    if (!dragOrigin) return;
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

  const onTransformEnd = () => {
    if (dragData && state.data) pushHistory(snapshotMeshEditState(dragData, state.mode, state.faceAction, selection));
    dragData = null;
    dragOrigin = null;
    dragScaleOrigin = null;
  };

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  transform.addEventListener("objectChange", onTransform);
  transform.addEventListener("dragging-changed", onTransformDraggingChanged);

  return {
    setMesh(mesh, data) {
      state.mesh = mesh;
      state.data = data;
      clearSelection(selection);
      past.length = 0;
      future.length = 0;
      notifyHistory();
      dragData = null;
      dragOrigin = null;
      dragScaleOrigin = null;
      rebuild();
    },
    updateData(data) { state.data = data; if (!transform.dragging) rebuild(); },
    setMode(mode) { state.mode = mode; clearSelection(selection); dragData = null; dragOrigin = null; dragScaleOrigin = null; rebuild(); },
    setFaceAction(action) {
      state.faceAction = action;
      if ((action === "translate" || action === "extrude" || action === "scale" || action === "inset") && state.mode === "faces") rebuild();
      else if (action === "bevel" && state.mode === "edges") rebuild();
      else transform.detach();
    },
    undo,
    redo,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    subscribeHistory(listener) {
      historyListeners.add(listener);
      return () => historyListeners.delete(listener);
    },
    addVertex(position) { if (!state.data || state.mode !== "vertices") return; const before = currentSnapshot(); const beforeCount = state.data.geometry.vertices.length / 3; const next = addVertex(state.data, position); if (next === state.data) return; selection.vertices.clear(); selection.vertices.add(beforeCount); updateGeometry(next, before); },
    addFaceFromSelection() {
      if (!state.data || state.mode !== "vertices" || selection.vertices.size !== 3) return;
      const before = currentSnapshot();
      const vertices = [...selection.vertices] as [number, number, number];
      const next = addGraphicsMeshFace(state.data, vertices);
      clearSelection(selection);
      updateGeometry(next, before);
    },
    moveSelectedVertices(delta) { if (!state.data) return; const ids = selectedVertexIds(state.data, selection, state.mode); if (!ids.size) return; const before = currentSnapshot(); updateGeometry(moveVertices(state.data, ids, delta), before); },
    weldSelectedVertices(tolerance = 1e-6) { if (!state.data || state.mode !== "vertices") return; const ids = [...selection.vertices]; if (!ids.length) return; const before = currentSnapshot(); const next = weldVertices(state.data, ids, tolerance); clearSelection(selection); updateGeometry(next, before); dragData = null; dragOrigin = null; },
    deleteSelectedVertices() { if (!state.data || state.mode !== "vertices") return; const ids = [...selection.vertices]; if (!ids.length) return; const before = currentSnapshot(); const next = deleteVertices(state.data, ids); clearSelection(selection); updateGeometry(next, before); dragData = null; dragOrigin = null; },
    deleteSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      const before = currentSnapshot();
      let next = state.data;
      for (const faceId of [...selection.faces].sort((a, b) => b - a)) next = deleteGraphicsMeshFace(next, faceId);
      clearSelection(selection);
      updateGeometry(next, before);
      dragData = null;
      dragOrigin = null;
    },
    duplicateSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      const before = currentSnapshot();
      updateGeometry(duplicateFaces(state.data, selection.faces), before);
    },
    extractSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      const extracted = extractFaces(state.data, selection.faces);
      if (!extracted) return;
      const before = currentSnapshot();
      let next = state.data;
      for (const faceId of [...selection.faces].sort((a, b) => b - a)) {
        next = deleteGraphicsMeshFace(next, faceId);
      }
      clearSelection(selection);
      updateGeometry(next, before);
    },
    extrudeSelectedFaces(distance) {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      const before = currentSnapshot();
      updateGeometry(extrude(state.data, selection.faces, distance), before);
      state.faceAction = "extrude";
      syncTransform();
    },
    insetSelectedFace(amount) { if (!state.data || !selection.faces.size) return; const before = currentSnapshot(); updateGeometry(insetKernel(state.data, selection.faces, amount), before); },
    insetSelectedFaceLegacy(amount) { if (!state.data || !selection.faces.size) return; const before = currentSnapshot(); updateGeometry(insetLegacy(state.data, selection.faces, amount), before); },
    bevelSelectedEdges(amount) { if (!state.data || !selection.edges.size) return; const before = currentSnapshot(); updateGeometry(bevel(state.data, selection.edges, amount), before); },
    splitSelectedEdges() {
      if (!state.data || state.mode !== "edges" || !selection.edges.size) return;
      const before = currentSnapshot();
      const next = splitEdges(state.data, new Set(selection.edges));
      clearSelection(selection);
      updateGeometry(next, before);
    },
    connectSelectedEdges() {
      if (!state.data || state.mode !== "edges" || selection.edges.size !== 2) return;
      const before = currentSnapshot();
      const next = connectEdges(state.data, new Set(selection.edges));
      clearSelection(selection);
      updateGeometry(next, before);
    },
    selectEdgeLoop() {
      if (!state.data || state.mode !== "edges" || selection.edges.size !== 1) return;
      const key = [...selection.edges][0];
      selection.edges = selectEdgeLoop(state.data, key);
      rebuild();
    },
    selectEdgeRing() {
      if (!state.data || state.mode !== "edges" || selection.edges.size !== 1) return;
      const key = [...selection.edges][0];
      selection.edges = selectEdgeRing(state.data, key);
      rebuild();
    },
    growSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      selection.faces = growSelection(state.data, selection.faces);
      rebuild();
    },
    shrinkSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      selection.faces = shrinkSelection(state.data, selection.faces);
      rebuild();
    },
    recalculateNormals() {
      if (!state.data) return;
      const before = currentSnapshot();
      updateGeometry(recalculateMeshNormals(state.data), before);
    },
    flipSelectedFaces() {
      if (!state.data || state.mode !== "faces" || !selection.faces.size) return;
      const before = currentSnapshot();
      const next = flipMeshFaces(state.data, new Set(selection.faces));
      clearSelection(selection);
      updateGeometry(next, before);
      dragData = null;
      dragOrigin = null;
    },
    dispose() { historyListeners.clear(); renderer.domElement.removeEventListener("pointerdown", onPointerDown); transform.removeEventListener("objectChange", onTransform); transform.removeEventListener("dragging-changed", onTransformDraggingChanged); transform.detach(); transform.dispose(); handles.removePivot(); handles.clear(); scene.remove(handles.group); }
  };
}

function toggleSelection<T>(set: Set<T>, value: T, additive: boolean) { if (!additive) set.clear(); if (additive && set.has(value)) set.delete(value); else set.add(value); }

export type { FaceEditAction, MeshEditMode, ThreeDMeshEditController } from "./types";
