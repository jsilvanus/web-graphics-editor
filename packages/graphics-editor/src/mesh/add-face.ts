import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";

/**
 * Add a triangular face using three existing vertex indices.
 *
 * The half-edge kernel keeps vertex identity intact and rebuilds the topology
 * from the resulting polygon set. The operation only accepts manifold,
 * consistently oriented adjacency: a new directed edge may not already exist,
 * and an undirected edge may not already have two incident faces.
 */
export function addFace(mesh: HalfEdgeMesh, vertices: [number, number, number]): HalfEdgeMesh {
  const [a, b, c] = vertices;
  if (a === b || b === c || c === a) {
    throw new Error("A face requires three distinct vertices");
  }

  for (const vertex of vertices) {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= mesh.vertices.length) {
      throw new Error(`Face references missing vertex ${vertex}`);
    }
  }

  const polygons = polygonsFromHalfEdges(mesh);
  const key = (x: number, y: number) => `${x}:${y}`;
  const undirectedKey = (x: number, y: number) => (x < y ? `${x}:${y}` : `${y}:${x}`);
  const directed = new Set<string>();
  const undirectedCounts = new Map<string, number>();

  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      const from = polygon[i];
      const to = polygon[(i + 1) % polygon.length];
      directed.add(key(from, to));
      const edge = undirectedKey(from, to);
      undirectedCounts.set(edge, (undirectedCounts.get(edge) ?? 0) + 1);
    }
  }

  const addedEdges: Array<[number, number]> = [
    [a, b],
    [b, c],
    [c, a],
  ];
  for (const [from, to] of addedEdges) {
    if (directed.has(key(from, to))) {
      throw new Error(`Face edge ${from}:${to} already exists`);
    }
    if ((undirectedCounts.get(undirectedKey(from, to)) ?? 0) >= 2) {
      throw new Error(`Face edge ${from}:${to} would make the mesh non-manifold`);
    }
  }

  const duplicate = polygons.some(
    p => p.length === 3 && new Set(p).size === 3 && p.every(vertex => vertices.includes(vertex)),
  );
  if (duplicate) throw new Error("The requested face already exists");

  return fromPolygons({ positions: mesh.positions, faces: [...polygons, [...vertices]] });
}
