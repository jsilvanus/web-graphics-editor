import * as THREE from "three";
import type { Graphics3DMesh } from "../types";
import {
  createMeshEditController,
  type FaceEditAction,
  type MeshEditMode,
  type ThreeDMeshEditController,
} from "./mesh-edit/controller";

export type { FaceEditAction, MeshEditMode, ThreeDMeshEditController };

export function createThreeDMeshEditController(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  onChange: (geometry: Graphics3DMesh["geometry"]) => void,
  onExtract?: (mesh: Graphics3DMesh) => void,
  onDraggingChanged?: (dragging: boolean) => void,
): ThreeDMeshEditController {
  return createMeshEditController(scene, camera, renderer, onChange, onExtract, onDraggingChanged);
}
