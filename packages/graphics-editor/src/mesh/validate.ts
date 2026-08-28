import type { HalfEdgeMesh } from "./half-edge";

export interface MeshValidationResult { valid: boolean; errors: string[] }

export function validateHalfEdgeMesh(mesh: HalfEdgeMesh): MeshValidationResult {
  const errors: string[] = [];
  for (const h of mesh.halfEdges) {
    if (!mesh.halfEdges[h.next]) errors.push(`half-edge ${h.id}: missing next`);
    if (h.twin !== null) {
      const twin = mesh.halfEdges[h.twin];
      if (!twin) errors.push(`half-edge ${h.id}: missing twin`);
      else {
        if (twin.twin !== h.id) errors.push(`half-edge ${h.id}: twin symmetry broken`);
        if (twin.vertex !== mesh.halfEdges[h.next].vertex) errors.push(`half-edge ${h.id}: twin destination mismatch`);
        if (mesh.halfEdges[twin.next].vertex !== h.vertex) errors.push(`half-edge ${h.id}: twin origin mismatch`);
      }
    }
    if (!mesh.faces[h.face]) errors.push(`half-edge ${h.id}: missing face ${h.face}`);
  }
  for (const face of mesh.faces) {
    const seen = new Set<number>();
    let h = face.halfEdge;
    while (!seen.has(h)) {
      seen.add(h);
      const current = mesh.halfEdges[h];
      if (!current || current.face !== face.id) { errors.push(`face ${face.id}: invalid boundary cycle`); break; }
      h = current.next;
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidHalfEdgeMesh(mesh: HalfEdgeMesh): void {
  const result = validateHalfEdgeMesh(mesh);
  if (!result.valid) throw new Error(`Invalid half-edge mesh: ${result.errors.join("; ")}`);
}
