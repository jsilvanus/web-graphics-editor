import * as THREE from "three";
import type { Graphics3DMesh } from "../types";
import { createMeshEditController, type FaceEditAction, type MeshEditMode, type ThreeDMeshEditController } from "./mesh-edit/controller";

export type { FaceEditAction, MeshEditMode, ThreeDMeshEditController };

export function createThreeDMeshEditController(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  onChange: (geometry: Graphics3DMesh["geometry"]) => void,
): ThreeDMeshEditController {
  return createMeshEditController(scene, camera, renderer, onChange);
}
