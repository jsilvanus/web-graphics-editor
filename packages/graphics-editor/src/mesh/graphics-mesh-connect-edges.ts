import type { Graphics3DMesh } from "../types";
import { edgeIdForVertices } from "./topology";
import { splitEdge } from "./split-edge";
import { splitFace } from "./split-face";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import type { HalfEdgeMesh } from "./half-edge";

export interface ConnectEdgesResult {
  mesh: Graphics3DMesh;
  faceId: number;
  newFaceId: number;
}

/**
 * Split two selected edges at their midpoints and connect those new vertices.
 * The two edges must bound the same face after splitting.
 *
 * This is the first topology-safe cut primitive for the editor. More general
 * multi-face loop cuts can build on the same operation.
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
  if (firstEdgeId === null) throw new Error(`First edge not found: ${firstKey}`);

  const firstNewVertex = topology.positions.length / 3;
  topology = splitEdge(topology, firstEdgeId);

  const secondEdgeId = edgeIdForVertices(topology, second[0], second[1]);
  if (secondEdgeId === null) throw new Error(`Second edge not found: ${secondKey}`);

  const secondNewVertex = topology.positions.length / 3;
  topology = splitEdge(topology, secondEdgeId);

  const faceId = findCommonFace(topology, firstNewVertex, secondNewVertex);
  if (faceId === null) {
    throw new Error("Selected edges do not bound a common face after splitting");
  }

  const result = splitFace(topology, faceId, firstNewVertex, secondNewVertex);
  return {
    mesh: graphicsMeshFromTopology(source, result.mesh),
    faceId: result.faceId,
    newFaceId: result.newFaceId,
  };
}

function parseEdgeKey(key: string): [number, number] {
  const [aText, bText] = key.split(":");
  const a = Number(aText);
  const b = Number(bText);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) {
    throw new Error(`Invalid edge key: ${key}`);
  }
  return [a, b];
}

function buildTopology(mesh: Graphics3DMesh): HalfEdgeMesh {
  const faces: number[][] = [];
  for (let i = 0; i + 2 < mesh.geometry.indices.length; i += 3) {
    faces.push([
      mesh.geometry.indices[i],
      mesh.geometry.indices[i + 1],
      mesh.geometry.indices[i + 2],
    ]);
  }
  return fromPolygons({ positions: mesh.geometry.vertices, faces });
}

function findCommonFace(mesh: HalfEdgeMesh, vertexA: number, vertexB: number): number | null {
  for (const face of mesh.faces) {
    if (face.boundary) continue;
    const vertices: number[] = [];
    let current = face.halfEdge;
    do {
      vertices.push(mesh.halfEdges[current].vertex);
      current = mesh.halfEdges[current].next;
    } while (current !== face.halfEdge);

    if (vertices.includes(vertexA) && vertices.includes(vertexB)) return face.id;
  }
  return null;
}

function graphicsMeshFromTopology(source: Graphics3DMesh, topology: HalfEdgeMesh): Graphics3DMesh {
  const indices = polygonsFromHalfEdges(topology).flat();
  return {
    ...source,
    geometry: {
      ...source.geometry,
      vertices: [...topology.positions],
      indices,
      normals: undefined,
    },
  };
}
