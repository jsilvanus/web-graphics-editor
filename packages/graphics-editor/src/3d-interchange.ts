import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DWorld, Provenance } from "./types";
import { createThreeGeometry } from "./3d-renderer";

export interface Graphics3DInterchangeResult { data: ArrayBuffer | object; warnings: string[] }

function provenanceExtras(provenance?: Provenance): Record<string, unknown> | undefined { return provenance ? { wegraProvenance: provenance } : undefined; }

/** Export one world to glTF/GLB. Unsupported editor-only concepts are reported as warnings. */
export async function export3DWorld(world: Graphics3DWorld, binary = true): Promise<Graphics3DInterchangeResult> {
  const scene = new THREE.Scene();
  scene.name = world.name ?? world.id;
  for (const mesh of world.meshes) {
    const object = new THREE.Mesh(createThreeGeometry(mesh), new THREE.MeshStandardMaterial({ color: mesh.material?.color ?? "#ffffff", opacity: mesh.material?.opacity ?? 1, transparent: (mesh.material?.opacity ?? 1) < 1, metalness: mesh.material?.metalness ?? 0, roughness: mesh.material?.roughness ?? 0.8, wireframe: mesh.material?.wireframe ?? false }));
    object.name = mesh.name ?? mesh.id; object.userData.graphics3DId = mesh.id; object.userData.wegraProvenance = mesh.provenance;
    object.position.set(...mesh.transform.position); object.rotation.set(...mesh.transform.rotation); object.scale.set(...mesh.transform.scale); scene.add(object);
  }
  for (const light of world.lights ?? []) {
    let object: THREE.Light;
    const color = light.color ?? "#ffffff", intensity = light.intensity ?? 1;
    switch (light.type) { case "ambient": object = new THREE.AmbientLight(color, intensity); break; case "directional": object = new THREE.DirectionalLight(color, intensity); break; case "point": object = new THREE.PointLight(color, intensity, light.distance ?? 0); break; case "spot": object = new THREE.SpotLight(color, intensity, light.distance ?? 0, light.angle ?? Math.PI / 3, light.penumbra ?? 0); break; }
    object.name = light.id; if (light.position) object.position.set(...light.position); if (light.rotation) object.rotation.set(...light.rotation); scene.add(object);
  }
  for (const camera of world.cameras) {
    const object = camera.projection === "orthographic" ? new THREE.OrthographicCamera(-5, 5, 5, -5, camera.near ?? 0.1, camera.far ?? 2000) : new THREE.PerspectiveCamera(camera.fov ?? 50, 1, camera.near ?? 0.1, camera.far ?? 2000);
    object.name = camera.name ?? camera.id; object.userData.graphics3DId = camera.id; object.position.set(...camera.position); object.rotation.set(...camera.rotation); scene.add(object);
  }
  const exporter = new GLTFExporter();
  const warnings: string[] = [];
  if (world.provenance) warnings.push("World provenance is stored as editor metadata where supported by the interchange exporter.");
  if (!binary) warnings.push("Textures referenced only by editor asset IDs require host-side asset resolution before glTF export.");
  const data = await new Promise<ArrayBuffer | object>((resolve, reject) => exporter.parse(scene, result => resolve(result as ArrayBuffer | object), reject, { binary, animations: [] }));
  return { data, warnings };
}

function vec3(attribute: THREE.BufferAttribute, i: number): [number, number, number] { return [attribute.getX(i), attribute.getY(i), attribute.getZ(i)]; }
function readMesh(object: THREE.Mesh): Graphics3DMesh {
  const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry;
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normalAttr = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const uvAttr = geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
  const vertices: number[] = [], normals: number[] = [], uv: number[] = [];
  for (let i = 0; i < position.count; i++) { const p = vec3(position, i); vertices.push(...p); if (normalAttr) normals.push(...vec3(normalAttr, i)); if (uvAttr) uv.push(uvAttr.getX(i), uvAttr.getY(i)); }
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  const standard = material as THREE.MeshStandardMaterial;
  const provenance = object.userData.wegraProvenance as Provenance | undefined;
  return { id: String(object.userData.graphics3DId ?? object.uuid), name: object.name || undefined, geometry: { vertices, indices: Array.from({ length: vertices.length / 3 }, (_, i) => i), normals: normalAttr ? normals : undefined, uv: uvAttr ? uv : undefined }, transform: { position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z], scale: object.scale.toArray() }, material: { color: standard?.color?.getHexString() ? `#${standard.color.getHexString()}` : undefined, opacity: standard?.opacity, metalness: standard?.metalness, roughness: standard?.roughness, wireframe: standard?.wireframe }, provenance };
}

/** Import a glTF/GLB ArrayBuffer into the editor's renderer-independent world model. */
export async function import3DWorld(data: ArrayBuffer, id: string, name?: string): Promise<Graphics3DWorld> {
  const loader = new GLTFLoader();
  const gltf = await new Promise<any>((resolve, reject) => loader.parse(data, "", resolve, reject));
  const meshes: Graphics3DMesh[] = [], cameras: Graphics3DCamera[] = [], lights: Graphics3DLight[] = [];
  gltf.scene.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh) meshes.push(readMesh(object));
    if (object instanceof THREE.PerspectiveCamera) cameras.push({ id: String(object.userData.graphics3DId ?? object.uuid), name: object.name || undefined, position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z], projection: "perspective", fov: object.fov, near: object.near, far: object.far });
    if (object instanceof THREE.OrthographicCamera) cameras.push({ id: String(object.userData.graphics3DId ?? object.uuid), name: object.name || undefined, position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z], projection: "orthographic", zoom: object.zoom, near: object.near, far: object.far });
    if (object instanceof THREE.AmbientLight || object instanceof THREE.DirectionalLight || object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
      const light = object as THREE.Light & { distance?: number; angle?: number; penumbra?: number };
      const type = object instanceof THREE.AmbientLight ? "ambient" : object instanceof THREE.DirectionalLight ? "directional" : object instanceof THREE.PointLight ? "point" : "spot";
      lights.push({ id: String(object.userData.graphics3DId ?? object.uuid), type, position: object.position.toArray(), rotation: [object.rotation.x, object.rotation.y, object.rotation.z], color: `#${object.color.getHexString()}`, intensity: object.intensity, distance: light.distance, angle: light.angle, penumbra: light.penumbra });
    }
  });
  return { id, name: name ?? gltf.scene.name || id, meshes, cameras, lights };
}
