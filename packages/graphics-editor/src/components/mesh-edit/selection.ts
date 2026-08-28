import * as THREE from "three";
import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import { faceVertexIndices } from "../../3d-mesh-operations";
import type { MeshEditMode, MeshEditSelection } from "./types";

export function createSelection(): MeshEditSelection {
  return { vertices: new Set(), edges: new Set(), faces: new Set() };
}

export function clearSelection(selection: MeshEditSelection) {
  selection.vertices.clear();
  selection.edges.clear();
  selection.faces.clear();
}

export function selectedVertexIds(data: Graphics3DMesh, selection: MeshEditSelection, mode: MeshEditMode): Set<number> {
  if (mode === "vertices") return new Set(selection.vertices);
  if (mode === "edges") {
    const ids = new Set<number>();
    for (const key of selection.edges) {
      const edge = meshEdges(data).find(e => edgeKey(e.a, e.b) === key);
      if (edge) { ids.add(edge.a); ids.add(edge.b); }
    }
    return ids;
  }
  if (mode === "faces") {
    const ids = new Set<number>();
    for (const face of selection.faces) faceVertexIndices(data, face)?.forEach(id => ids.add(id));
    return ids;
  }
  return new Set();
}

export function faceHandleGeometry(data: Graphics3DMesh, mesh: THREE.Mesh, face: number): THREE.BufferGeometry | undefined {
  const ids = faceVertexIndices(data, face);
  if (!ids) return undefined;
  const positions = mesh.geometry.getAttribute("position");
  const values = new Float32Array(ids.flatMap(i => [positions.getX(i), positions.getY(i), positions.getZ(i)]));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(values, 3));
  return geometry;
}
