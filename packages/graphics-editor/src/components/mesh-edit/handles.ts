import * as THREE from "three";
import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import type { MeshEditMode, MeshEditSelection } from "./types";
import { faceHandleGeometry } from "./selection";

export interface HandleManager {
  group: THREE.Group;
  clear: () => void;
  rebuild: () => void;
  removePivot: () => void;
  setPivot: (position: THREE.Vector3) => void;
}

export function createHandleManager(scene: THREE.Scene, selection: MeshEditSelection, state: { mesh?: THREE.Mesh; data?: Graphics3DMesh; mode: MeshEditMode }): HandleManager {
  const group = new THREE.Group();
  scene.add(group);

  const clear = () => {
    while (group.children.length) {
      const object = group.children.pop()!;
      object.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose());
        else if (mesh.material) (mesh.material as THREE.Material).dispose();
      });
    }
  };
  const removePivot = () => {
    const pivot = group.userData.pivot as THREE.Object3D | undefined;
    if (pivot) { scene.remove(pivot); group.userData.pivot = undefined; }
  };
  const setPivot = (position: THREE.Vector3) => {
    removePivot();
    const pivot = new THREE.Group();
    pivot.position.copy(position);
    group.userData.pivot = pivot;
    scene.add(pivot);
  };
  const rebuild = () => {
    clear(); removePivot();
    const { mesh, data, mode } = state;
    if (!mesh || !data) return;
    if (mode === "vertices") {
      for (let i = 0; i < data.geometry.vertices.length / 3; i++) {
        const handle = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 6), new THREE.MeshBasicMaterial({ color: selection.vertices.has(i) ? "#ffcc00" : "#fff" }));
        handle.position.fromArray(data.geometry.vertices, i * 3); handle.userData.vertexIndex = i; group.add(handle);
      }
      if (selection.vertices.size) setPivot(averageVertices(data, selection.vertices));
    } else if (mode === "edges") {
      const edges = meshEdges(data);
      for (const edge of edges) {
        const a = new THREE.Vector3().fromArray(data.geometry.vertices, edge.a * 3), b = new THREE.Vector3().fromArray(data.geometry.vertices, edge.b * 3);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: selection.edges.has(edgeKey(edge.a, edge.b)) ? "#ffcc00" : "#fff", linewidth: 3 }));
        line.userData.edgeKey = edgeKey(edge.a, edge.b); group.add(line);
      }
      if (selection.edges.size) setPivot(averageEdgeVertices(data, selection.edges));
    } else if (mode === "faces") {
      const center = new THREE.Vector3(); let count = 0;
      for (const face of selection.faces) {
        const geometry = faceHandleGeometry(data, mesh, face); if (!geometry) continue;
        const handle = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#ffcc00", transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false }));
        handle.userData.faceIndex = face; handle.renderOrder = 10; group.add(handle);
        const ids = geometry.getAttribute("position"); for (let i = 0; i < ids.count; i++) { center.fromBufferAttribute(ids, i); count++; }
      }
      if (count) setPivot(center.multiplyScalar(1 / count));
    }
  };
  return { group, clear, rebuild, removePivot, setPivot };
}

function averageVertices(data: Graphics3DMesh, ids: Set<number>) {
  const result = new THREE.Vector3(); ids.forEach(id => result.add(new THREE.Vector3().fromArray(data.geometry.vertices, id * 3))); return result.multiplyScalar(1 / ids.size);
}
function averageEdgeVertices(data: Graphics3DMesh, keys: Set<string>) {
  const result = new THREE.Vector3(); let count = 0;
  for (const edge of meshEdges(data)) if (keys.has(edgeKey(edge.a, edge.b))) { result.add(new THREE.Vector3().fromArray(data.geometry.vertices, edge.a * 3)); result.add(new THREE.Vector3().fromArray(data.geometry.vertices, edge.b * 3)); count += 2; }
  return count ? result.multiplyScalar(1 / count) : result;
}
