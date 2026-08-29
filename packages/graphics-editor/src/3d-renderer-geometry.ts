import * as THREE from "three";
import type { Graphics3DMesh } from "./types";

/** Convert renderer-independent mesh geometry into a disposable Three.js geometry. */
export function createThreeGeometry(mesh: Graphics3DMesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.geometry.vertices, 3));
  geometry.setIndex(mesh.geometry.indices);
  if (mesh.geometry.normals?.length) {
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(mesh.geometry.normals, 3));
  } else {
    geometry.computeVertexNormals();
  }
  if (mesh.geometry.uv?.length) {
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(mesh.geometry.uv, 2));
  }
  geometry.computeBoundingSphere();
  return geometry;
}
