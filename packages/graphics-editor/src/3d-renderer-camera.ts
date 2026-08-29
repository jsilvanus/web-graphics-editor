import * as THREE from "three";
import type { Graphics3DCamera } from "./types";

/** Convert the serializable editor camera into a Three.js camera. */
export function createThreeCamera(camera: Graphics3DCamera, aspect = 1): THREE.Camera {
  const near = camera.near ?? 0.1;
  const far = camera.far ?? 2000;
  const [x, y, z] = camera.position;
  const [rx, ry, rz] = camera.rotation;

  if (camera.projection === "orthographic") {
    const zoom = camera.zoom ?? 1;
    const halfHeight = 5 / zoom;
    const halfWidth = halfHeight * aspect;
    const result = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, near, far);
    result.position.set(x, y, z);
    result.rotation.set(rx, ry, rz);
    return result;
  }

  const result = new THREE.PerspectiveCamera(camera.fov ?? 50, aspect, near, far);
  result.position.set(x, y, z);
  result.rotation.set(rx, ry, rz);
  return result;
}
