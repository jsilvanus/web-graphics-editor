import type { GraphicsDocument, Layer } from "./types";

export const GRAPHICS_DOCUMENT_VERSION = 1;

type SerializedLayer = Omit<Layer, "type"> & { type: Layer["type"] | "rect" };

type SerializedDocument = Omit<GraphicsDocument, "layers"> & {
  version?: number;
  layers: SerializedLayer[];
};

/** Serialize the editor document independently of React state. */
export function serializeGraphicsDocument(document: GraphicsDocument): string {
  return JSON.stringify({ version: GRAPHICS_DOCUMENT_VERSION, ...document });
}

/**
 * Deserialize a graphics document and normalize the legacy Saarnavideo
 * rectangle type (`rect`) to the canonical `rectangle` type.
 */
export function deserializeGraphicsDocument(input: string | SerializedDocument): GraphicsDocument {
  const value: SerializedDocument = typeof input === "string" ? JSON.parse(input) as SerializedDocument : input;
  if (!value || typeof value !== "object") throw new Error("Invalid graphics document");
  if (!Number.isFinite(value.width) || !Number.isFinite(value.height) || !Array.isArray(value.layers)) {
    throw new Error("Invalid graphics document shape");
  }

  return {
    width: value.width,
    height: value.height,
    background: value.background,
    layers: value.layers.map(layer => ({
      ...layer,
      type: layer.type === "rect" ? "rectangle" : layer.type,
    })),
  };
}
