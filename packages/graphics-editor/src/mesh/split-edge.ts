import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import { edgeIdForVertices, edgeFaces } from "./topology";
import { assertValidHalfEdgeMesh } from "./validate";

type Vec3 = [number, number, number];

function position(mesh: HalfEdgeMesh, id: number): Vec3 {
  return [mesh.positions[id * 3], mesh.positions[id * 3 + 1], mesh.positions[id * 3 + 2]];
}

function splitTriangle(face: number[], a: number, b: number, m: number): number[][] {
  const ia = face.indexOf(a);
  const ib = face.indexOf(b);
  if (ia < 0 || ib < 0) return [face];
  const opposite = face.find(id => id !== a && id !== b);
  if (opposite === undefined) return [face];
  if ((ia + 1) % 3 === ib) return [[a, m, opposite], [m, b, opposite]];
  return [[b, m, opposite], [m, a, opposite]];
}

/** Split an edge by inserting a point and rebuilding only its incident faces. */
export function splitEdge(mesh: HalfEdgeMesh, edgeId: number, t = 0.5): HalfEdgeMesh {
  const edge = mesh.edges.find(candidate => candidate.id === edgeId);
  if (!edge) throw new Error(`Mesh edge not found: ${edgeId}`);
  const halfEdge = mesh.halfEdges[edge.halfEdge];
  const a = halfEdge.vertex;
  const b = mesh.halfEdges[halfEdge.next].vertex;
  const clamped = Math.max(0, Math.min(1, t));
  const pa = position(mesh, a), pb = position(mesh, b);
  const p: Vec3 = [
    pa[0] + (pb[0] - pa[0]) * clamped,
    pa[1] + (pb[1] - pa[1]) * clamped,
    pa[2] + (pb[2] - pa[2]) * clamped,
  ];
  const newVertex = mesh.positions.length / 3;
  const positions = [...mesh.positions, ...p];
  const incidentFaces = new Set(edgeFaces(mesh, edgeId));
  const polygons = polygonsFromHalfEdges(mesh);
  const nextPolygons: number[][] = [];
  polygons.forEach((polygon, faceId) => {
    nextPolygons.push(...(incidentFaces.has(faceId) ? splitTriangle(polygon, a, b, newVertex) : [polygon]));
  });
  const result = fromPolygons({ positions, faces: nextPolygons });
  assertValidHalfEdgeMesh(result);
  return result;
}

export function splitEdgeByVertices(mesh: HalfEdgeMesh, a: number, b: number, t = 0.5): HalfEdgeMesh {
  const edgeId = edgeIdForVertices(mesh, a, b);
  if (edgeId === null) throw new Error(`Mesh edge not found between vertices ${a} and ${b}`);
  return splitEdge(mesh, edgeId, t);
}
