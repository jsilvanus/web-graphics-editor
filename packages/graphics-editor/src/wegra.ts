import type { GraphicsAsset, GraphicsDocument } from "./types";
import type { ActorVocabulary } from "./history/operations";
import type { DocumentHistory } from "./history/store";

export const WEGRA_FORMAT = "wegra" as const;
export const WEGRA_VERSION = 2 as const;
export const SUPPORTED_WEGRA_VERSIONS = [1, 2] as const;
export type SupportedWegraVersion = (typeof SUPPORTED_WEGRA_VERSIONS)[number];

export interface WegraManifest {
  format: typeof WEGRA_FORMAT;
  version: number;
  document: "document.json";
  history: boolean;
  provenance: "provenance/actors.json";
  assets: string[];
}

export interface WegraProject {
  document: GraphicsDocument;
  history?: DocumentHistory;
  actors?: ActorVocabulary;
}

const encoder = new TextEncoder(), decoder = new TextDecoder();

/** Deterministic JSON representation: object keys are sorted recursively; array order is semantic and preserved. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite number");
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(input).sort().map(key => [key, sortJsonValue(input[key])]));
  }
  return value;
}

function migrateV1ToV2(value: unknown): unknown {
  if (!value || typeof value !== "object") throw new Error("Invalid WEGRA manifest");
  const manifest = value as Record<string, unknown>;
  if (manifest.format !== WEGRA_FORMAT || manifest.version !== 1) throw new Error("Invalid WEGRA v1 manifest");
  return { ...manifest, version: 2 };
}

type ManifestMigration = (value: unknown) => unknown;
export const WEGRA_MIGRATIONS: Readonly<Record<number, ManifestMigration>> = {
  1: migrateV1ToV2,
};

export function migrateWegraManifest(value: unknown): WegraManifest {
  if (!value || typeof value !== "object") throw new Error("Invalid WEGRA manifest");
  let current = value as Record<string, unknown>;
  const version = current.version;
  if (current.format !== WEGRA_FORMAT || typeof version !== "number" || !Number.isInteger(version)) throw new Error("Invalid WEGRA manifest");
  if (version > WEGRA_VERSION) throw new Error(`Unsupported WEGRA version ${version}`);
  if (version < 1) throw new Error(`Unsupported WEGRA version ${version}`);
  while (current.version !== WEGRA_VERSION) {
    const migration = WEGRA_MIGRATIONS[current.version as number];
    if (!migration) throw new Error(`No migration registered for WEGRA version ${current.version}`);
    current = migration(current) as Record<string, unknown>;
  }
  const assets = Array.isArray(current.assets) ? current.assets.filter((x): x is string => typeof x === "string").sort() : [];
  return {
    format: WEGRA_FORMAT,
    version: WEGRA_VERSION,
    document: "document.json",
    history: current.history === true,
    provenance: "provenance/actors.json",
    assets,
  };
}

function crc32(data: Uint8Array) { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function u16(n: number) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
function u32(n: number) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
function concat(...parts: Uint8Array[]) { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; }

function zip(files: { name: string; data: Uint8Array }[]) {
  const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name));
  const locals: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const f of ordered) {
    const name = encoder.encode(f.name), crc = crc32(f.data);
    const h = concat(new Uint8Array([80, 75, 3, 4]), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0), name);
    locals.push(concat(h, f.data));
    central.push(concat(new Uint8Array([80, 75, 1, 2]), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name));
    offset += h.length + f.data.length;
  }
  const body = concat(...locals), cd = concat(...central);
  return concat(body, cd, new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, ordered.length & 255, (ordered.length >>> 8) & 255, ordered.length & 255, (ordered.length >>> 8) & 255, ...u32(cd.length), ...u32(body.length), 0, 0]));
}

async function assetBytes(asset: GraphicsAsset) {
  if (asset.url.startsWith("data:")) {
    const comma = asset.url.indexOf(","), meta = asset.url.slice(5, comma), body = asset.url.slice(comma + 1);
    if (meta.includes(";base64")) { const binary = atob(body); return Uint8Array.from(binary, c => c.charCodeAt(0)); }
    return encoder.encode(decodeURIComponent(body));
  }
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`Unable to read asset ${asset.name}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function serializeWegra(project: WegraProject): Promise<Uint8Array> {
  const assets = project.document.assets ?? [];
  const embedded: GraphicsAsset[] = [];
  const files: { name: string; data: Uint8Array }[] = [];
  for (const asset of assets) {
    try {
      const data = await assetBytes(asset), path = `assets/${asset.id}`;
      files.push({ name: path, data });
      embedded.push({ ...asset, url: path });
    } catch {
      embedded.push(asset);
    }
  }
  const document = { ...project.document, assets: embedded };
  const manifest: WegraManifest = { format: WEGRA_FORMAT, version: WEGRA_VERSION, document: "document.json", history: !!project.history, provenance: "provenance/actors.json", assets: embedded.filter(a => a.url.startsWith("assets/")).map(a => a.url).sort() };
  files.unshift(
    { name: "manifest.json", data: encoder.encode(canonicalJson(manifest)) },
    { name: "document.json", data: encoder.encode(canonicalJson(document)) },
    { name: "provenance/actors.json", data: encoder.encode(canonicalJson(project.actors ?? { actors: {} })) },
  );
  if (project.history) files.push({ name: "history/history.json", data: encoder.encode(canonicalJson(project.history)) });
  return zip(files);
}

export function deserializeWegra(bytes: Uint8Array): WegraProject {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), files: Record<string, Uint8Array> = {};
  let p = 0;
  while (p + 4 <= bytes.length) {
    const sig = view.getUint32(p, true);
    if (sig === 0x04034b50) {
      const nameLen = view.getUint16(p + 26, true), extraLen = view.getUint16(p + 28, true), size = view.getUint32(p + 18, true), name = decoder.decode(bytes.slice(p + 30, p + 30 + nameLen)), start = p + 30 + nameLen + extraLen;
      files[name] = bytes.slice(start, start + size);
      p = start + size;
    } else if (sig === 0x06054b50) break;
    else p++;
  }
  const rawManifest = JSON.parse(decoder.decode(files["manifest.json"] ?? new Uint8Array())) as unknown;
  const manifest = migrateWegraManifest(rawManifest);
  const document = JSON.parse(decoder.decode(files["document.json"])) as GraphicsDocument;
  document.assets = (document.assets ?? []).map(asset => {
    const data = files[asset.url];
    if (!data) return asset;
    const url = typeof URL !== "undefined" && typeof Blob !== "undefined" ? URL.createObjectURL(new Blob([data], { type: asset.mimeType ?? "application/octet-stream" })) : asset.url;
    return { ...asset, url };
  });
  return {
    document,
    actors: JSON.parse(decoder.decode(files["provenance/actors.json"] ?? encoder.encode('{"actors":{}}'))) as ActorVocabulary,
    history: manifest.history && files["history/history.json"] ? JSON.parse(decoder.decode(files["history/history.json"])) as DocumentHistory : undefined,
  };
}
