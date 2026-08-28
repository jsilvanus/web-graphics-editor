import * as THREE from "three";
import type { Graphics3DCamera } from "./types";

export const DEFAULT_CAMERA: Graphics3DCamera = {
  id: "camera-main",
  name: "Main camera",
  position: [5, 4, 8],
  rotation: [0, 0, 0],
  projection: "perspective",
  fov: 50,
  near: 0.1,
  far: 2000,
};

export function makeWorkspaceCamera(camera: Graphics3DCamera, aspect: number): THREE.Camera {
  if (camera.projection === "orthographic") {
    const h = 5 / (camera.zoom ?? 1);
    const w = h * aspect;
    const result = new THREE.OrthographicCamera(-w, w, h, -h, camera.near ?? 0.1, camera.far ?? 2000);
    result.position.set(...camera.position);
    result.rotation.set(...camera.rotation);
    return result;
  }
  const result = new THREE.PerspectiveCamera(camera.fov ?? 50, aspect, camera.near ?? 0.1, camera.far ?? 2000);
  result.position.set(...camera.position);
  result.rotation.set(...camera.rotation);
  return result;
}
