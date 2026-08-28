import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DMesh } from "../types";

export type MeshEditMode = "object" | "vertices" | "faces";

export interface ThreeDMeshEditOverlayProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  mesh: THREE.Mesh | undefined;
  data: Graphics3DMesh | undefined;
  mode: MeshEditMode;
  onChange: (geometry: Graphics3DMesh["geometry"]) => void;
}

function readVertex(mesh: THREE.Mesh, index: number): THREE.Vector3 {
  const position = mesh.geometry.getAttribute("position");
  return new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index));
}

export function ThreeDMeshEditOverlay({ scene, camera, renderer, mesh, data, mode, onChange }: ThreeDMeshEditOverlayProps) {
  const groupRef = useRef<THREE.Group>();
  const controlsRef = useRef<TransformControls>();
  const selectedVertexRef = useRef<number | null>(null);
  const faceRef = useRef<THREE.Mesh>();
  const originalRef = useRef<THREE.Vector3>();

  useEffect(() => {
    if (!mesh || !data || mode === "object") return;
    const group = new THREE.Group();
    group.name = "graphics3d-edit-handles";
    groupRef.current = group;
    mesh.add(group);

    const vertexCount = data.geometry.vertices.length / 3;
    const handleGeometry = new THREE.SphereGeometry(0.075, 10, 6);
    for (let i = 0; i < vertexCount; i++) {
      const handle = new THREE.Mesh(handleGeometry, new THREE.MeshBasicMaterial({ color: "#ffffff" }));
      handle.position.fromArray(data.geometry.vertices, i * 3);
      handle.userData.vertexIndex = i;
      group.add(handle);
    }
    handleGeometry.dispose = handleGeometry.dispose.bind(handleGeometry);

    const controls = new TransformControls(camera, renderer.domElement);
    controls.setMode("translate");
    controlsRef.current = controls;
    scene.add(controls.getHelper());

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onDown = (event: PointerEvent) => {
      if (mode !== "vertices" || controls.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(group.children, false)[0];
      if (!hit) return;
      const vertex = hit.object.userData.vertexIndex as number;
      selectedVertexRef.current = vertex;
      originalRef.current = readVertex(mesh, vertex);
      controls.attach(hit.object);
    };
    const onChangeControl = () => {
      const vertex = selectedVertexRef.current;
      const handle = vertex == null ? undefined : group.children[vertex];
      if (vertex == null || !handle) return;
      const vertices = [...data.geometry.vertices];
      vertices[vertex * 3] = handle.position.x;
      vertices[vertex * 3 + 1] = handle.position.y;
      vertices[vertex * 3 + 2] = handle.position.z;
      onChange({ ...data.geometry, vertices });
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    controls.addEventListener("objectChange", onChangeControl);
    return () => {
      renderer.domElement.removeEventListener("pointerdown", onDown);
      controls.removeEventListener("objectChange", onChangeControl);
      controls.detach();
      scene.remove(controls.getHelper());
      controls.dispose();
      mesh.remove(group);
      handleGeometry.dispose();
      groupRef.current = undefined;
      controlsRef.current = undefined;
      selectedVertexRef.current = null;
    };
  }, [scene, camera, renderer, mesh, data, mode, onChange]);

  useEffect(() => {
    if (!mesh || !data || mode === "object") return;
    const group = groupRef.current;
    if (!group) return;
    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i];
      if (child.userData.vertexIndex == null) continue;
      child.position.fromArray(data.geometry.vertices, i * 3);
    }
    if (mode === "faces") {
      const geometry = mesh.geometry;
      const material = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
      const face = new THREE.Mesh(geometry, material);
      face.name = "graphics3d-face-selection";
      face.userData.editFaceOverlay = true;
      faceRef.current = face;
      mesh.add(face);
      return () => { mesh.remove(face); material.dispose(); };
    }
  }, [mesh, data?.geometry, mode]);

  return null;
}
