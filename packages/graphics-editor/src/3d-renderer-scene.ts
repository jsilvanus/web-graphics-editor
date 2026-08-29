import * as THREE from "three";
import type { Graphics3DLight, Graphics3DMesh, Graphics3DView, Graphics3DWorld } from "./types";
import { createThreeGeometry } from "./3d-renderer-geometry";
import { createThreeMaterial } from "./3d-renderer-material";

function isVisible(mesh: Graphics3DMesh, view?: Pick<Graphics3DView, "visibility">): boolean {
  const filter = view?.visibility;
  if (!filter || filter.mode === "all") return true;
  const included = filter.objects.includes(mesh.id);
  return filter.mode === "include" ? included : !included;
}

function addLight(scene: THREE.Scene, light: Graphics3DLight): void {
  const color = light.color ?? "#ffffff";
  const intensity = light.intensity ?? 1;
  let object: THREE.Light;
  switch (light.type) {
    case "ambient": object = new THREE.AmbientLight(color, intensity); break;
    case "directional": object = new THREE.DirectionalLight(color, intensity); break;
    case "point": object = new THREE.PointLight(color, intensity, light.distance ?? 0); break;
    case "spot": object = new THREE.SpotLight(color, intensity, light.distance ?? 0, light.angle ?? Math.PI / 3, light.penumbra ?? 0); break;
  }
  if (light.position) object.position.set(...light.position);
  if (light.rotation) object.rotation.set(...light.rotation);
  scene.add(object);
}

/** Build a disposable Three.js scene from the renderer-independent world model. */
export function createThreeScene(world: Graphics3DWorld, view?: Pick<Graphics3DView, "visibility">): THREE.Scene {
  const scene = new THREE.Scene();
  for (const light of world.lights ?? []) addLight(scene, light);
  for (const mesh of world.meshes) {
    if (!isVisible(mesh, view)) continue;
    const object = new THREE.Mesh(createThreeGeometry(mesh), createThreeMaterial(mesh.material));
    object.name = mesh.name ?? mesh.id;
    object.userData.graphics3DId = mesh.id;
    object.position.set(...mesh.transform.position);
    object.rotation.set(...mesh.transform.rotation);
    object.scale.set(...mesh.transform.scale);
    scene.add(object);
  }
  return scene;
}
