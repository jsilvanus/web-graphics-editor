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

/**
 * Selects a geometric edge loop. At each endpoint the continuation is the
 * incident edge whose direction is most opposite to the incoming edge.
 * This remains useful on triangulated meshes, where a strict quad-only
 * topological loop is not always defined.
 */
export function selectEdgeLoop(data: Graphics3DMesh, startKey: string): Set<string> {
  const edges = meshEdges(data);
  const byVertex = new Map<number, typeof edges>();
  for (const edge of edges) {
    for (const vertex of [edge.a, edge.b]) {
      const list = byVertex.get(vertex) ?? [];
      list.push(edge);
      byVertex.set(vertex, list);
    }
  }
  const start = edges.find(edge => edgeKey(edge.a, edge.b) === startKey);
  if (!start) return new Set();

  const result = new Set<string>([edgeKey(start.a, start.b)]);
  walkEdgeChain(data, start.a, start.b, start, byVertex, result);
  walkEdgeChain(data, start.b, start.a, start, byVertex, result);
  return result;
}

function walkEdgeChain(
  data: Graphics3DMesh,
  vertex: number,
  previousVertex: number,
  previousEdge: { a: number; b: number },
  byVertex: Map<number, ReturnType<typeof meshEdges>>,
  result: Set<string>,
) {
  const visitedVertices = new Set<number>();
  let currentVertex = vertex;
  let incomingVertex = previousVertex;
  let incomingEdge = previousEdge;

  while (!visitedVertices.has(currentVertex)) {
    visitedVertices.add(currentVertex);
    const candidates = (byVertex.get(currentVertex) ?? []).filter(edge =>
      edgeKey(edge.a, edge.b) !== edgeKey(incomingEdge.a, incomingEdge.b)
    );
    const next = bestContinuation(data, currentVertex, incomingVertex, candidates);
    if (!next) return;

    const key = edgeKey(next.a, next.b);
    if (result.has(key)) return;
    result.add(key);

    const nextVertex = next.a === currentVertex ? next.b : next.a;
    incomingVertex = currentVertex;
    currentVertex = nextVertex;
    incomingEdge = next;
  }
}

function bestContinuation(
  data: Graphics3DMesh,
  vertex: number,
  previousVertex: number,
  candidates: ReturnType<typeof meshEdges>,
) {
  if (!candidates.length) return undefined;
  const previous = vertexDirection(data, vertex, previousVertex);
  let best = candidates[0];
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const other = candidate.a === vertex ? candidate.b : candidate.a;
    const direction = vertexDirection(data, vertex, other);
    const denominator = Math.max(previous.length() * direction.length(), 1e-8);
    const score = -(previous.dot(direction)) / denominator;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function vertexDirection(data: Graphics3DMesh, from: number, to: number): THREE.Vector3 {
  const a = new THREE.Vector3().fromArray(data.geometry.vertices, from * 3);
  const b = new THREE.Vector3().fromArray(data.geometry.vertices, to * 3);
  return b.sub(a);
}

/**
 * Selects the geometric edge ring: all edges whose direction is parallel to
 * the starting edge. On triangulated meshes this gives a useful ring even
 * when the original quad structure is no longer explicitly represented.
 */
export function selectEdgeRing(data: Graphics3DMesh, startKey: string): Set<string> {
  const edges = meshEdges(data);
  const start = edges.find(edge => edgeKey(edge.a, edge.b) === startKey);
  if (!start) return new Set();

  const byFace = new Map<number, { a: number; b: number }[]>();
  const owners = new Map<string, number[]>();
  for (let face = 0; face < data.geometry.indices.length / 3; face++) {
    const ids = faceVertexIndices(data, face);
    if (!ids) continue;
    const faceEdges = ids.map((id, i) => ({
      a: id,
      b: ids[(i + 1) % ids.length],
    }));
    byFace.set(face, faceEdges);
    for (const edge of faceEdges) {
      const key = edgeKey(edge.a, edge.b);
      owners.set(key, [...(owners.get(key) ?? []), face]);
    }
  }

  const target = vertexDirection(data, start.a, start.b).normalize();
  const result = new Set<string>([edgeKey(start.a, start.b)]);
  const queue = [edgeKey(start.a, start.b)];
  let foundConnectedContinuation = false;

  while (queue.length) {
    const currentKey = queue.shift()!;
    for (const face of owners.get(currentKey) ?? []) {
      const candidates = (byFace.get(face) ?? []).filter(edge => edgeKey(edge.a, edge.b) !== currentKey);
      const parallel = candidates
        .map(edge => ({
          edge,
          score: Math.abs(target.dot(vertexDirection(data, edge.a, edge.b).normalize())),
        }))
        .filter(item => item.score >= 0.85)
        .sort((a, b) => b.score - a.score);

      const next = parallel[0]?.edge;
      if (!next) continue;
      foundConnectedContinuation = true;
      const key = edgeKey(next.a, next.b);
      if (!result.has(key)) {
        result.add(key);
        queue.push(key);
      }
    }
  }

  // Triangulated meshes often do not preserve the original quad-ring
  // connectivity. Keep the previous geometric fallback for those meshes.
  if (!foundConnectedContinuation) {
    for (const edge of edges) {
      const direction = vertexDirection(data, edge.a, edge.b).normalize();
      if (Math.abs(target.dot(direction)) >= 0.85) result.add(edgeKey(edge.a, edge.b));
    }
  }

  return result;
}
