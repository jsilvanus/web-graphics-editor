import type { Graphics3DMesh } from "../../types";
import { edgeKey, meshEdges } from "../../3d-mesh-topology";
import { faceCornerForEdge } from "./bevel-topology";

interface FaceEdgeOffset {
  a: number;
  b: number;
}

/**
 * Bevel selected edges in one topology pass.
 *
 * The previous implementation bevelled edges sequentially. That breaks as soon
 * as two selected edges share a face because beveling the first edge removes
 * the original second edge from that face. Building all offsets from the
 * original topology lets adjacent edges meet cleanly at a new corner.
 */
export function bevelSelectedEdges(mesh: Graphics3DMesh, keys: Set<string>, amount: number): Graphics3DMesh {
  if (amount <= 0 || keys.size === 0) return mesh;

  const edges = meshEdges(mesh);
  const selected = new Map<string, { a: number; b: number; faces: number[] }>();
  for (const edge of edges) {
    const key = edgeKey(edge.a, edge.b);
    if (keys.has(key) && edge.faces.length >= 1 && edge.faces.length <= 2) {
      selected.set(key, edge);
    }
  }
  if (selected.size === 0) return mesh;

  const offsets = new Map<string, FaceEdgeOffset>();
  const affectedFaces = new Set<number>();
  const vertices = [...mesh.geometry.vertices];

  // Create one pair of offset vertices for every selected edge on every
  // incident face. Keeping them face-local is important at bevel corners.
  for (const [key, edge] of selected) {
    for (const face of edge.faces) {
      const corner = faceCornerForEdge(mesh, face, edge.a, edge.b);
      if (corner === undefined) continue;
      const pa = point(mesh, edge.a), pb = point(mesh, edge.b), pc = point(mesh, corner);
      const distanceToCorner = Math.min(distance(pa, pc), distance(pb, pc));
      const t = Math.min(0.49, amount / Math.max(distanceToCorner, 1e-8));
      const a = lerp(pa, pc, t);
      const b = lerp(pb, pc, t);
      const aIndex = vertices.length / 3;
      vertices.push(...a, ...b);
      offsets.set(faceEdgeKey(face, key), { a: aIndex, b: aIndex + 1 });
      affectedFaces.add(face);
    }
  }

  const indices: number[] = [];

  // Rebuild affected triangle faces. At a vertex shared by two selected
  // edges, the incoming and outgoing offsets become a new corner edge.
  for (let face = 0; face < mesh.geometry.indices.length / 3; face++) {
    const base = face * 3;
    const ids = [mesh.geometry.indices[base], mesh.geometry.indices[base + 1], mesh.geometry.indices[base + 2]];
    if (!affectedFaces.has(face)) {
      indices.push(...ids);
      continue;
    }

    const polygon: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = ids[i];
      const b = ids[(i + 1) % 3];
      const key = edgeKey(a, b);
      const offset = offsets.get(faceEdgeKey(face, key));
      if (offset) {
        const start = a === selected.get(key)?.a ? offset.a : offset.b;
        const end = b === selected.get(key)?.b ? offset.b : offset.a;
        // Store the edge endpoints at their respective vertices. The next
        // edge decides independently whether its outgoing offset is needed.
        polygon.push(start);
        if (i === 2) polygon.push(end);
      } else {
        // Only emit the vertex if the preceding edge did not already replace
        // it with an offset endpoint.
        const incomingKey = edgeKey(ids[(i + 2) % 3], a);
        if (!offsets.has(faceEdgeKey(face, incomingKey))) polygon.push(a);
      }
    }

    // The compact edge traversal above is intentionally conservative. Build
    // the final boundary directly from per-vertex incoming/outgoing edges so
    // adjacent selected edges produce a valid quad/hexagon.
    polygon.length = 0;
    for (let i = 0; i < 3; i++) {
      const vertex = ids[i];
      const previous = ids[(i + 2) % 3];
      const next = ids[(i + 1) % 3];
      const incomingKey = edgeKey(previous, vertex);
      const outgoingKey = edgeKey(vertex, next);
      const incoming = offsets.get(faceEdgeKey(face, incomingKey));
      const outgoing = offsets.get(faceEdgeKey(face, outgoingKey));
      if (incoming) polygon.push(previous === selected.get(incomingKey)?.a ? incoming.b : incoming.a);
      else if (outgoing) polygon.push(vertex === selected.get(outgoingKey)?.a ? outgoing.a : outgoing.b);
      else polygon.push(vertex);
      if (incoming && outgoing) {
        polygon.push(vertex === selected.get(outgoingKey)?.a ? outgoing.a : outgoing.b);
      }
    }

    triangulateFan(polygon, indices);
  }

  // Fill the bevel band for each selected edge. Interior edges get a quad
  // between the two face-local offset edges; boundary edges get a strip back
  // to the original boundary.
  for (const [key, edge] of selected) {
    if (edge.faces.length === 2) {
      const [f0, f1] = edge.faces;
      const o0 = offsets.get(faceEdgeKey(f0, key));
      const o1 = offsets.get(faceEdgeKey(f1, key));
      if (!o0 || !o1) continue;
      const reversed = edgeIsReversed(mesh.geometry.indices, f0, edge.a, edge.b);
      indices.push(...(reversed
        ? [o0.a, o1.a, o1.b, o0.a, o1.b, o0.b]
        : [o0.a, o0.b, o1.b, o0.a, o1.b, o1.a]));
    } else {
      const face = edge.faces[0];
      const offset = offsets.get(faceEdgeKey(face, key));
      if (!offset) continue;
      const reversed = edgeIsReversed(mesh.geometry.indices, face, edge.a, edge.b);
      indices.push(...(reversed
        ? [edge.a, edge.b, offset.b, edge.a, offset.b, offset.a]
        : [edge.a, offset.a, offset.b, edge.a, offset.b, edge.b]));
    }
  }

  return {
    ...mesh,
    geometry: {
      ...mesh.geometry,
      vertices,
      indices,
      normals: undefined,
      uv: undefined,
    },
  };
}

export function bevelOneEdge(mesh: Graphics3DMesh, key: string, amount: number): Graphics3DMesh {
  return bevelSelectedEdges(mesh, new Set([key]), amount);
}

export function hasBevelableEdge(mesh: Graphics3DMesh, key: string): boolean {
  const edge = meshEdges(mesh).find(e => edgeKey(e.a, e.b) === key);
  return !!edge && edge.faces.length >= 1 && edge.faces.length <= 2;
}

function faceEdgeKey(face: number, key: string): string {
  return `${face}:${key}`;
}

function triangulateFan(polygon: number[], indices: number[]): void {
  if (polygon.length < 3) return;
  for (let i = 1; i < polygon.length - 1; i++) {
    indices.push(polygon[0], polygon[i], polygon[i + 1]);
  }
}

function point(mesh: Graphics3DMesh, i: number): [number, number, number] {
  return [mesh.geometry.vertices[i * 3], mesh.geometry.vertices[i * 3 + 1], mesh.geometry.vertices[i * 3 + 2]];
}

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function edgeIsReversed(indices: number[], face: number, a: number, b: number): boolean {
  const i = face * 3;
  const ids = [indices[i], indices[i + 1], indices[i + 2]];
  for (let j = 0; j < 3; j++) if (ids[j] === a && ids[(j + 1) % 3] === b) return false;
  return true;
}
