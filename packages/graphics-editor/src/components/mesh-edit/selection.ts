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
 * Selects an edge loop using inferred quad topology where possible. A pair of
 * coplanar triangles sharing a diagonal is treated as one logical quad; loop
 * traversal then crosses the quad through opposite boundary edges. The
 * geometric traversal remains the fallback for genuinely triangular regions.
 */
export function selectEdgeLoop(data: Graphics3DMesh, startKey: string): Set<string> {
  const edges = meshEdges(data);
  const start = edges.find(edge => edgeKey(edge.a, edge.b) === startKey);
  if (!start) return new Set();

  const quads = inferLogicalQuads(data);
  const opposite = new Map<string, string>();
  for (const quad of quads) {
    for (let i = 0; i < quad.boundary.length; i++) {
      opposite.set(quad.boundary[i], quad.boundary[(i + 2) % quad.boundary.length]);
    }
  }

  if (opposite.has(startKey)) {
    const result = new Set<string>([startKey]);
    walkOppositeEdges(startKey, opposite, result);
    return result;
  }

  return selectGeometricEdgeLoop(data, startKey);
}

function walkOppositeEdges(startKey: string, opposite: Map<string, string>, result: Set<string>) {
  let current = startKey;
  while (true) {
    const next = opposite.get(current);
    if (!next || result.has(next)) return;
    result.add(next);
    current = next;
  }
}

function selectGeometricEdgeLoop(data: Graphics3DMesh, startKey: string): Set<string> {
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
  const result = new Set<string>([startKey]);
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

type LogicalQuad = { vertices: [number, number, number, number]; boundary: string[] };

/** Infer quads from adjacent, nearly coplanar triangles sharing a diagonal. */
function inferLogicalQuads(data: Graphics3DMesh): LogicalQuad[] {
  const faces = Array.from({ length: data.geometry.indices.length / 3 }, (_, face) => faceVertexIndices(data, face));
  const owners = new Map<string, number[]>();
  faces.forEach((ids, face) => {
    if (!ids) return;
    for (let i = 0; i < ids.length; i++) {
      const key = edgeKey(ids[i], ids[(i + 1) % ids.length]);
      owners.set(key, [...(owners.get(key) ?? []), face]);
    }
  });

  const used = new Set<number>();
  const result: LogicalQuad[] = [];
  for (const fs of owners.values()) {
    if (fs.length !== 2) continue;
    const [first, second] = fs;
    if (used.has(first) || used.has(second)) continue;
    const a = faces[first];
    const b = faces[second];
    if (!a || !b || !trianglesAreCoplanar(data, a, b)) continue;
    const vertices = [...new Set([...a, ...b])];
    if (vertices.length !== 4) continue;

    const shared = a.filter(vertex => b.includes(vertex));
    if (shared.length !== 2) continue;
    const sharedKey = edgeKey(shared[0], shared[1]);
    const boundary = [...new Set([
      ...a.map((vertex, index) => edgeKey(vertex, a[(index + 1) % a.length])),
      ...b.map((vertex, index) => edgeKey(vertex, b[(index + 1) % b.length])),
    ])].filter(key => key !== sharedKey);
    if (boundary.length !== 4) continue;

    used.add(first);
    used.add(second);
    result.push({ vertices: vertices as LogicalQuad["vertices"], boundary });
  }
  return result;
}

function trianglesAreCoplanar(data: Graphics3DMesh, a: number[], b: number[]): boolean {
  if (a.length !== 3 || b.length !== 3) return false;
  const normal = triangleNormal(data, a[0], a[1], a[2]);
  const other = triangleNormal(data, b[0], b[1], b[2]);
  return normal.lengthSq() > 1e-12 && other.lengthSq() > 1e-12 && Math.abs(normal.normalize().dot(other.normalize())) >= 0.999;
}

function triangleNormal(data: Graphics3DMesh, a: number, b: number, c: number): THREE.Vector3 {
  const pa = new THREE.Vector3().fromArray(data.geometry.vertices, a * 3);
  const pb = new THREE.Vector3().fromArray(data.geometry.vertices, b * 3);
  const pc = new THREE.Vector3().fromArray(data.geometry.vertices, c * 3);
  return pb.sub(pa).cross(pc.sub(pa));
}

/**
 * Selects an edge ring from inferred quad strips. Parallel edges connected
 * through logical quads are preferred; disconnected parallel edges are not
 * pulled in. If no logical quad connectivity exists, use the geometric
 * triangulated-mesh fallback.
 */
export function selectEdgeRing(data: Graphics3DMesh, startKey: string): Set<string> {
  const edges = meshEdges(data);
  const start = edges.find(edge => edgeKey(edge.a, edge.b) === startKey);
  if (!start) return new Set();

  const quads = inferLogicalQuads(data);
  const target = vertexDirection(data, start.a, start.b).normalize();
  const result = new Set<string>([startKey]);
  const queue = [startKey];
  const connections = new Map<string, Set<string>>();

  for (const quad of quads) {
    const compatible = quad.boundary.filter(key => {
      const [a, b] = key.split(":").map(Number);
      return Math.abs(target.dot(vertexDirection(data, a, b).normalize())) >= 0.85;
    });
    for (const key of compatible) {
      const set = connections.get(key) ?? new Set<string>();
      for (const other of compatible) if (other !== key) set.add(other);
      connections.set(key, set);
    }
  }

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of connections.get(current) ?? []) {
      if (result.has(next)) continue;
      result.add(next);
      queue.push(next);
    }
  }

  if (result.size > 1) return result;

  for (const edge of edges) {
    const direction = vertexDirection(data, edge.a, edge.b).normalize();
    if (Math.abs(target.dot(direction)) >= 0.85) result.add(edgeKey(edge.a, edge.b));
  }
  return result;
}
