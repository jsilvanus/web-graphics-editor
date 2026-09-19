import type { Graphics3DMesh } from "../types";
import { edgeFaces, edgeIdForVertices } from "./topology";
import { splitEdge } from "./split-edge";
import { splitFace } from "./split-face";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import type { HalfEdgeMesh } from "./half-edge";
import { assertValidHalfEdgeMesh } from "./validate";

export interface ConnectEdgesResult {
  mesh: Graphics3DMesh;
  newFaceIds: number[];
}

/**
 * Cut a surface between two selected edges.
 *
 * Both endpoint edges are split at their midpoints. A shortest face path
 * between the two edges is found, every crossed edge is split, and the
 * resulting cut points are connected face-by-face.
 */
export function connectGraphicsMeshEdges(
  source: Graphics3DMesh,
  firstKey: string,
  secondKey: string,
): ConnectEdgesResult {
  if (firstKey === secondKey) throw new Error("Cannot connect an edge to itself");

  let topology = buildTopology(source);
  const first = parseEdgeKey(firstKey);
  const second = parseEdgeKey(secondKey);
  const firstEdgeId = edgeIdForVertices(topology, first[0], first[1]);
  const secondEdgeId = edgeIdForVertices(topology, second[0], second[1]);
  if (firstEdgeId === null) throw new Error(`First edge not found: ${firstKey}`);
  if (secondEdgeId === null) throw new Error(`Second edge not found: ${secondKey}`);

  const path = findFacePath(topology, firstEdgeId, secondEdgeId);
  if (!path) throw new Error("No topological path exists between the selected edges");

  const pointIds: number[] = [];
  const firstPoint = topology.positions.length / 3;
  topology = splitEdge(topology, firstEdgeId);
  pointIds.push(firstPoint);

  for (const crossingEdgeId of path.crossingEdges) {
    const edge = topology.edges.find(candidate => candidate.id === crossingEdgeId);
    if (!edge) throw new Error(`Cut path edge disappeared: ${crossingEdgeId}`);
    const point = topology.positions.length / 3;
    const a = topology.halfEdges[edge.halfEdge].vertex;
    const b = topology.halfEdges[topology.halfEdges[edge.halfEdge].next].vertex;
    const currentEdgeId = edgeIdForVertices(topology, a, b);
    if (currentEdgeId === null) throw new Error("Cut path edge could not be resolved");
    topology = splitEdge(topology, currentEdgeId);
    pointIds.push(point);
  }

  const secondPoint = topology.positions.length / 3;
  const secondCurrentEdgeId = edgeIdForVertices(topology, second[0], second[1]);
  if (secondCurrentEdgeId === null) throw new Error(`Second edge disappeared: ${secondKey}`);
  topology = splitEdge(topology, secondCurrentEdgeId);
  pointIds.push(secondPoint);

  const newFaceIds: number[] = [];
  for (let i = 0; i + 1 < pointIds.length; i++) {
    const a = pointIds[i], b = pointIds[i + 1];
    const existingEdge = edgeIdForVertices(topology, a, b);
    if (existingEdge !== null) continue;

    const faceId = findFaceContainingVertices(topology, a, b);
    if (faceId === null) {
      throw new Error(`Cut points ${a} and ${b} do not share a face`);
    }

    const result = splitFace(topology, faceId, a, b);
    topology = result.mesh;
    newFaceIds.push(result.newFaceId);
  }

  assertValidHalfEdgeMesh(topology);
  return { mesh: graphicsMeshFromTopology(source, topology), newFaceIds };
}

function findFacePath(mesh: HalfEdgeMesh, startEdgeId: number, endEdgeId: number): { crossingEdges: number[] } | null {
  const startFaces = edgeFaces(mesh, startEdgeId);
  const targetFaces = new Set(edgeFaces(mesh, endEdgeId));
  const queue = [...startFaces];
  const previous = new Map<number, { face: number; edge: number }>();
  const seen = new Set(queue);

  while (queue.length) {
    const face = queue.shift()!;
    if (targetFaces.has(face)) {
      const crossingEdges: number[] = [];
      let current = face;
      while (!startFaces.includes(current)) {
        const step = previous.get(current);
        if (!step) return null;
        crossingEdges.push(step.edge);
        current = step.face;
      }
      crossingEdges.reverse();
      return { crossingEdges };
    }

    for (const edge of mesh.edges) {
      const h = mesh.halfEdges[edge.halfEdge];
      if (h.face !== face || h.twin === null) continue;
      const neighbor = mesh.halfEdges[h.twin].face;
      if (edge.id === startEdgeId || edge.id === endEdgeId || seen.has(neighbor)) continue;
      seen.add(neighbor);
      previous.set(neighbor, { face, edge: edge.id });
      queue.push(neighbor);
    }
  }
  return null;
}

function findFaceContainingVertices(mesh: HalfEdgeMesh, a: number, b: number): number | null {
  for (const face of mesh.faces) {
    if (face.boundary) continue;
    const vertices: number[] = [];
    let current = face.halfEdge;
    do {
      vertices.push(mesh.halfEdges[current].vertex);
      current = mesh.halfEdges[current].next;
    } while (current !== face.halfEdge);
    if (vertices.includes(a) && vertices.includes(b)) return face.id;
  }
  return null;
}

function parseEdgeKey(key: string): [number, number] {
  const [aText, bText] = key.split(":");
  const a = Number(aText);
  const b = Number(bText);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) throw new Error(`Invalid edge key: ${key}`);
  return [a, b];
}

function buildTopology(mesh: Graphics3DMesh): HalfEdgeMesh {
  const faces: number[][] = [];
  for (let i = 0; i + 2 < mesh.geometry.indices.length; i += 3) {
    faces.push([mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]]);
  }
  return fromPolygons({ positions: mesh.geometry.vertices, faces });
}

function graphicsMeshFromTopology(source: Graphics3DMesh, topology: HalfEdgeMesh): Graphics3DMesh {
  return {
    ...source,
    geometry: {
      ...source.geometry,
      vertices: [...topology.positions],
      indices: polygonsFromHalfEdges(topology).flat(),
      normals: undefined,
    },
  };
}
