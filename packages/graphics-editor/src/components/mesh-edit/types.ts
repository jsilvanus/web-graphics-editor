import type * as THREE from "three";
import type { Graphics3DMesh } from "../../types";

export type MeshEditMode = "object" | "vertices" | "edges" | "faces";
export type FaceEditAction = "translate" | "extrude" | "inset" | "bevel";

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
  extrudeSelectedFace: (distance: number) => void;
  insetSelectedFace: (amount: number) => void;
  insetSelectedFaceLegacy: (amount: number) => void;
  bevelSelectedEdges: (amount: number) => void;
  dispose: () => void;
}
