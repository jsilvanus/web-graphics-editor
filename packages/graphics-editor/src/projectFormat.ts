import type { GraphicsDocument, Layer, Scene } from "./types";

export const WEGRA_EXTENSION = ".wegra";
export const WEGRA_FORMAT = "wegra";
export const WEGRA_VERSION = 1;

export interface WegraManifest {
  format: typeof WEGRA_FORMAT;
  version: number;
  document: string;
  objects: string;
  scenes: string;
  timelines: string;
  assets: string;
  preview?: string;
}

export interface WegraPackage {
  manifest: WegraManifest;
  document: Omit<GraphicsDocument, "layers">;
  objects: Layer[];
  scenes: Scene[];
  timeline?: GraphicsDocument["timeline"];
}

export function createWegraPackage(document: GraphicsDocument): WegraPackage {
  const { layers, timeline, ...documentData } = document;
  return {
    manifest: {
      format: WEGRA_FORMAT,
      version: WEGRA_VERSION,
      document: "document.json",
      objects: "objects/",
      scenes: "scenes/",
      timelines: "timelines/",
      assets: "assets/",
    },
    document: documentData,
    objects: layers,
    scenes: timeline?.scenes ?? [],
    timeline,
  };
}

export function restoreWegraPackage(pkg: WegraPackage): GraphicsDocument {
  return {
    ...pkg.document,
    layers: pkg.objects,
    timeline: pkg.timeline,
  };
}

export function encodeWegra(document: GraphicsDocument): Blob {
  // The package is assembled by the browser ZIP adapter in projectZip.ts.
  // Keeping this function's contract here makes the project format independent
  // of the UI and allows a Node/FFmpeg-side packager later.
  throw new Error("ZIP encoding is implemented by projectZip.ts");
}
