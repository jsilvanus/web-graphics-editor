import type { HalfEdgeMesh } from "./half-edge";

export interface MeshValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateHalfEdgeMesh(mesh: HalfEdgeMesh): MeshValidationResult {
  const errors: string[] = [];
  const add = (message: string) => {
    if (!errors.includes(message)) errors.push(message);
  };

  if (mesh.positions.length % 3 !== 0) add("positions length is not divisible by 3");

  const vertexIds = new Set<number>();
  for (const vertex of mesh.vertices) {
    if (vertexIds.has(vertex.id)) add(`duplicate vertex id ${vertex.id}`);
    vertexIds.add(vertex.id);
  }

  const halfEdgeIds = new Set<number>();
  for (const halfEdge of mesh.halfEdges) {
    if (halfEdgeIds.has(halfEdge.id)) add(`duplicate half-edge id ${halfEdge.id}`);
    halfEdgeIds.add(halfEdge.id);
  }

  const faceIds = new Set<number>();
  for (const face of mesh.faces) {
    if (faceIds.has(face.id)) add(`duplicate face id ${face.id}`);
    faceIds.add(face.id);
  }

  const edgeIds = new Set<number>();
  for (const edge of mesh.edges) {
    if (edgeIds.has(edge.id)) add(`duplicate edge id ${edge.id}`);
    edgeIds.add(edge.id);
  }

  const halfEdgesById = new Map(mesh.halfEdges.map(h => [h.id, h]));
  const verticesPerPosition = mesh.positions.length / 3;

  for (const vertex of mesh.vertices) {
    if (vertex.id < 0 || vertex.id >= verticesPerPosition) {
      add(`vertex ${vertex.id}: position is out of bounds`);
    }
    if (vertex.halfEdge !== null) {
      const halfEdge = halfEdgesById.get(vertex.halfEdge);
      if (!halfEdge) add(`vertex ${vertex.id}: missing half-edge ${vertex.halfEdge}`);
      else if (halfEdge.vertex !== vertex.id)
        add(`vertex ${vertex.id}: half-edge ${vertex.halfEdge} has different origin`);
    }
  }

  const halfEdgesPerUndirectedEdge = new Map<string, number[]>();
  const directedEdges = new Set<string>();

  for (const h of mesh.halfEdges) {
    if (!vertexIds.has(h.vertex)) add(`half-edge ${h.id}: missing vertex ${h.vertex}`);

    const next = halfEdgesById.get(h.next);
    if (!next) {
      add(`half-edge ${h.id}: missing next ${h.next}`);
    } else {
      if (!vertexIds.has(next.vertex)) add(`half-edge ${h.id}: next has missing vertex ${next.vertex}`);
      if (next.face !== h.face) add(`half-edge ${h.id}: next crosses face boundary`);
      if (next.vertex === h.vertex) add(`half-edge ${h.id}: zero-length edge`);
      const directedKey = `${h.vertex}:${next.vertex}`;
      if (directedEdges.has(directedKey)) add(`duplicate directed half-edge ${directedKey}`);
      directedEdges.add(directedKey);

      const a = Math.min(h.vertex, next.vertex);
      const b = Math.max(h.vertex, next.vertex);
      const key = `${a}:${b}`;
      halfEdgesPerUndirectedEdge.set(key, [...(halfEdgesPerUndirectedEdge.get(key) ?? []), h.id]);
    }

    if (!faceIds.has(h.face)) add(`half-edge ${h.id}: missing face ${h.face}`);

    if (h.twin !== null) {
      const twin = halfEdgesById.get(h.twin);
      if (!twin) {
        add(`half-edge ${h.id}: missing twin ${h.twin}`);
      } else {
        if (twin.twin !== h.id) add(`half-edge ${h.id}: twin symmetry broken`);
        if (next && twin.vertex !== next.vertex) add(`half-edge ${h.id}: twin destination mismatch`);
        const twinNext = halfEdgesById.get(twin.next);
        if (twinNext && twinNext.vertex !== h.vertex) add(`half-edge ${h.id}: twin origin mismatch`);
        if (twin.face === h.face) add(`half-edge ${h.id}: twin belongs to same face`);
      }
    }
  }

  for (const [key, ids] of halfEdgesPerUndirectedEdge) {
    if (ids.length > 2) add(`non-manifold edge ${key}: ${ids.length} half-edges`);
    if (ids.length === 2) {
      const [a, b] = ids.map(id => halfEdgesById.get(id)!);
      if (a.twin !== b.id || b.twin !== a.id) add(`edge ${key}: paired half-edges are not twins`);
    }
  }

  const edgeKeys = new Set<string>();
  for (const edge of mesh.edges) {
    const h = halfEdgesById.get(edge.halfEdge);
    if (!h) {
      add(`edge ${edge.id}: missing half-edge ${edge.halfEdge}`);
      continue;
    }
    const next = halfEdgesById.get(h.next);
    if (!next) continue;
    const a = Math.min(h.vertex, next.vertex);
    const b = Math.max(h.vertex, next.vertex);
    const key = `${a}:${b}`;
    if (edgeKeys.has(key)) add(`duplicate edge record ${key}`);
    edgeKeys.add(key);
  }

  for (const [key, ids] of halfEdgesPerUndirectedEdge) {
    if (!edgeKeys.has(key)) add(`missing edge record ${key}`);
    if (ids.length === 1 && halfEdgesById.get(ids[0])?.twin !== null) {
      add(`edge ${key}: boundary half-edge unexpectedly has a twin`);
    }
  }

  const referencedHalfEdges = new Set<number>();
  for (const face of mesh.faces) {
    if (!halfEdgeIds.has(face.halfEdge)) {
      add(`face ${face.id}: missing half-edge ${face.halfEdge}`);
      continue;
    }

    const seen = new Set<number>();
    let currentId = face.halfEdge;
    while (!seen.has(currentId)) {
      seen.add(currentId);
      referencedHalfEdges.add(currentId);
      const current = halfEdgesById.get(currentId);
      if (!current || current.face !== face.id) {
        add(`face ${face.id}: invalid boundary cycle`);
        break;
      }
      currentId = current.next;
    }

    if (currentId !== face.halfEdge) add(`face ${face.id}: boundary cycle does not close`);
    if (seen.size < 3) add(`face ${face.id}: fewer than three half-edges`);
  }

  for (const h of mesh.halfEdges) {
    if (!referencedHalfEdges.has(h.id)) add(`half-edge ${h.id}: not referenced by any face cycle`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidHalfEdgeMesh(mesh: HalfEdgeMesh): void {
  const result = validateHalfEdgeMesh(mesh);
  if (!result.valid) throw new Error(`Invalid half-edge mesh: ${result.errors.join("; ")}`);
}
