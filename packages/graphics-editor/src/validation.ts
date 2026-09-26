import type { GraphicsDocument } from "./types";

export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGraphicsDocument(document: unknown): DocumentValidationResult {
  const errors: string[] = [];
  if (!document || typeof document !== "object")
    return { valid: false, errors: ["Document must be an object"] };
  const d = document as Partial<GraphicsDocument>;
  if (!Number.isFinite(d.width) || d.width! <= 0)
    errors.push("Document width must be a positive finite number");
  if (!Number.isFinite(d.height) || d.height! <= 0)
    errors.push("Document height must be a positive finite number");
  if (!Array.isArray(d.layers)) errors.push("Document layers must be an array");
  if (!Array.isArray(d.layers)) return { valid: false, errors };
  const ids = new Set<string>();
  for (const layer of d.layers) {
    if (!layer || typeof layer !== "object") {
      errors.push("Layer must be an object");
      continue;
    }
    if (typeof layer.id !== "string" || !layer.id) errors.push("Every layer needs a non-empty id");
    else if (ids.has(layer.id)) errors.push(`Duplicate layer id: ${layer.id}`);
    else ids.add(layer.id);
    if (!["text", "image", "rectangle", "ellipse", "line", "path", "group", "3d-view"].includes(layer.type))
      errors.push(`Invalid layer type: ${String(layer.type)}`);
    for (const key of ["x", "y", "width", "height"])
      if (!Number.isFinite(layer[key as keyof typeof layer] as number))
        errors.push(`Layer ${layer.id ?? "?"} has invalid ${key}`);
  }
  for (const layer of d.layers) {
    if (layer.parentId && !ids.has(layer.parentId))
      errors.push(`Layer ${layer.id} references missing parent ${layer.parentId}`);
  }
  for (const layer of d.layers) {
    const seen = new Set<string>();
    let current = layer;
    while (current.parentId) {
      if (seen.has(current.id)) {
        errors.push(`Layer parent cycle detected at ${layer.id}`);
        break;
      }
      seen.add(current.id);
      const parent = d.layers.find(item => item.id === current.parentId);
      if (!parent) break;
      current = parent;
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidGraphicsDocument(document: unknown): asserts document is GraphicsDocument {
  const result = validateGraphicsDocument(document);
  if (!result.valid) throw new Error(`Invalid graphics document: ${result.errors.join("; ")}`);
}
