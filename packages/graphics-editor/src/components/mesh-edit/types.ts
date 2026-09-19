import type * as THREE from "three";
import type { Graphics3DMesh } from "../../types";

export type MeshEditMode = "object" | "vertices" | "edges" | "faces";
export type FaceEditAction = "translate" | "extrude" | "inset" | "bevel" | "scale";

export interface MeshEditContext {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  mesh?: THREE.Mesh;
  data?: Graphics3DMesh;
}

export interface MeshEditSelection {
  vertices: Set<number>;
  edges: Set<string>;
  faces: Set<number>;
}

export interface ThreeDMeshEditController {
  setMesh: (mesh: THREE.Mesh | undefined, data: Graphics3DMesh | undefined) => void;
  updateData: (data: Graphics3DMesh | undefined) => void;
  setMode: (mode: MeshEditMode) => void;
  setFaceAction: (action: FaceEditAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  subscribeHistory: (listener: () => void) => () => void;
  addVertex: (position: [number, number, number]) => void;
  addFaceFromSelection: () => void;
  moveSelectedVertices: (delta: [number, number, number]) => void;
  weldSelectedVertices: (tolerance?: number) => void;
  deleteSelectedVertices: () => void;
  deleteSelectedFaces: () => void;
  extrudeSelectedFaces: (distance: number) => void;
  insetSelectedFace: (amount: number) => void;
  insetSelectedFaceLegacy: (amount: number) => void;
  bevelSelectedEdges: (amount: number) => void;
  splitSelectedEdges: () => void;
  connectSelectedEdges: () => void;
  growSelectedFaces: () => void;
  shrinkSelectedFaces: () => void;
  recalculateNormals: () => void;
  flipSelectedFaces: () => void;
  dispose: () => void;
}
