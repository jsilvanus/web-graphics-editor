let primaryId: string | null = null;
let referenceId: string | null = null;

export function setReferenceSelection(id: string | null) { primaryId = id; }
export function setReferenceFromSelection() { if (primaryId) referenceId = primaryId; }
export function clearReference() { referenceId = null; }
export function getReferenceId() { return referenceId; }
