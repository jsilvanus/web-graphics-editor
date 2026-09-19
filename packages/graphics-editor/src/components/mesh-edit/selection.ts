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

export function growFaceSelection(data: Graphics3DMesh, faces: Set<number>): Set<number> {
  if (!faces.size) return new Set();
  const selected = new Set(faces);
  const owners = new Map<string, number[]>();
  for (let face = 0; face < data.geometry.indices.length / 3; face++) {
    const ids = faceVertexIndices(data, face);
    if (!ids) continue;
    for (let i = 0; i < ids.length; i++) {
      const key = edgeKey(ids[i], ids[(i + 1) % ids.length]);
      owners.set(key, [...(owners.get(key) ?? []), face]);
    }
  }
  for (const fs of owners.values()) {
    if (fs.some(face => faces.has(face))) fs.forEach(face => selected.add(face));
  }
  return selected;
}

export function shrinkFaceSelection(data: Graphics3DMesh, faces: Set<number>): Set<number> {
  if (!faces.size) return new Set();
  const owners = new Map<string, number[]>();
  for (let face = 0; face < data.geometry.indices.length / 3; face++) {
    const ids = faceVertexIndices(data, face);
    if (!ids) continue;
    for (let i = 0; i < ids.length; i++) {
      const key = edgeKey(ids[i], ids[(i + 1) % ids.length]);
      owners.set(key, [...(owners.get(key) ?? []), face]);
    }
  }
  const result = new Set(faces);
  for (const face of faces) {
    const ids = faceVertexIndices(data, face);
    if (!ids) continue;
    if (ids.some((id, i) => (owners.get(edgeKey(id, ids[(i + 1) % ids.length])) ?? []).some(other => !faces.has(other)))) result.delete(face);
  }
  return result;
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
