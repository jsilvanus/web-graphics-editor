import type { HalfEdgeMesh } from "./half-edge";

export interface MeshValidationResult { valid: boolean; errors: string[] }

export function validateHalfEdgeMesh(mesh: HalfEdgeMesh): MeshValidationResult {
  const errors: string[] = [];
  const vertexIds = new Set(mesh.vertices.map(v => v.id));
  const halfEdgeIds = new Set(mesh.halfEdges.map(h => h.id));
  const faceIds = new Set(mesh.faces.map(f => f.id));
  const edgeIds = new Set(mesh.edges.map(e => e.id));
  const halfEdgesById = new Map(mesh.halfEdges.map(h => [h.id, h]));

  if (mesh.positions.length % 3 !== 0) errors.push("positions length is not divisible by 3");
  for (const vertex of mesh.vertices) {
    if (vertex.id < 0 || vertex.id >= mesh.positions.length / 3) {
      errors.push(`vertex ${vertex.id}: position is out of bounds`);
    }
    if (vertex.halfEdge !== null && !halfEdgeIds.has(vertex.halfEdge)) {
      errors.push(`vertex ${vertex.id}: missing half-edge ${vertex.halfEdge}`);
    }
  }

  for (const h of mesh.halfEdges) {
    if (!vertexIds.has(h.vertex)) errors.push(`half-edge ${h.id}: missing vertex ${h.vertex}`);

    const next = halfEdgesById.get(h.next);
    if (!next) {
      errors.push(`half-edge ${h.id}: missing next ${h.next}`);
    } else if (next.vertex === h.vertex) {
      errors.push(`half-edge ${h.id}: zero-length edge`);
    }

    if (!faceIds.has(h.face)) errors.push(`half-edge ${h.id}: missing face ${h.face}`);

    if (h.twin !== null) {
      const twin = halfEdgesById.get(h.twin);
      if (!twin) {
        errors.push(`half-edge ${h.id}: missing twin ${h.twin}`);
      } else {
        if (twin.twin !== h.id) errors.push(`half-edge ${h.id}: twin symmetry broken`);
        if (next && twin.vertex !== next.vertex) errors.push(`half-edge ${h.id}: twin destination mismatch`);
        const twinNext = halfEdgesById.get(twin.next);
        if (twinNext && twinNext.vertex !== h.vertex) errors.push(`half-edge ${h.id}: twin origin mismatch`);
      }
    }
  }

  for (const edge of mesh.edges) {
    if (!halfEdgeIds.has(edge.halfEdge)) {
      errors.push(`edge ${edge.id}: missing half-edge ${edge.halfEdge}`);
    }
    if (!edgeIds.has(edge.id)) errors.push(`edge ${edge.id}: invalid id`);
  }

  for (const face of mesh.faces) {
    if (!halfEdgeIds.has(face.halfEdge)) {
      errors.push(`face ${face.id}: missing half-edge ${face.halfEdge}`);
      continue;
    }

    const seen = new Set<number>();
    let currentId = face.halfEdge;
    while (!seen.has(currentId)) {
      seen.add(currentId);
      const current = halfEdgesById.get(currentId);
      if (!current || current.face !== face.id) {
        errors.push(`face ${face.id}: invalid boundary cycle`);
        break;
      }
      currentId = current.next;
    }

    if (currentId !== face.halfEdge) errors.push(`face ${face.id}: boundary cycle does not close`);
    if (seen.size < 3) errors.push(`face ${face.id}: fewer than three half-edges`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidHalfEdgeMesh(mesh: HalfEdgeMesh): void {
  const result = validateHalfEdgeMesh(mesh);
  if (!result.valid) throw new Error(`Invalid half-edge mesh: ${result.errors.join("; ")}`);
}
