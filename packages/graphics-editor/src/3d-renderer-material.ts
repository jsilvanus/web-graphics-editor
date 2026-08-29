import * as THREE from "three";
import type { Graphics3DMaterial } from "./types";

/** Convert the editor material model into a basic Three.js PBR material. */
export function createThreeMaterial(material?: Graphics3DMaterial): THREE.MeshStandardMaterial {
  const value = material ?? {};
  const opacity = value.opacity ?? 1;
  return new THREE.MeshStandardMaterial({
    color: value.color ?? "#ffffff",
    opacity,
    transparent: opacity < 1,
    metalness: value.metalness ?? 0,
    roughness: value.roughness ?? 0.8,
    wireframe: value.wireframe ?? false,
  });
}
