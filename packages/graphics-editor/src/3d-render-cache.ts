import type { Graphics3DCamera, Graphics3DView, Graphics3DWorld } from "./types";

export interface Graphics3DRenderCacheEntry { key: string; image: string; createdAt: number }

const DEFAULT_MAX_ENTRIES = 120;
let maxEntries = DEFAULT_MAX_ENTRIES;
const cache = new Map<string, Graphics3DRenderCacheEntry>();

function stable(value: unknown): string {
  return JSON.stringify(value, (key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>).sort().reduce((out, k) => {
        out[k] = (val as Record<string, unknown>)[k];
        return out;
      }, {} as Record<string, unknown>);
    }
    return val;
  });
}

/**
 * The source world/camera/view is part of the key, so source changes naturally
 * invalidate old frames without mutating the document or maintaining dirty flags.
 * The evaluated world time is intentionally supplied by callers as part of the
 * world snapshot when caching animated frames.
 */
export function create3DRenderCacheKey(
  world: Graphics3DWorld,
  camera: Graphics3DCamera,
  view: Graphics3DView,
  width: number,
  height: number,
  pixelRatio: number,
): string {
  return stable({ world, camera, visibility: view.visibility, renderSettings: view.renderSettings, width, height, pixelRatio });
}

export function get3DRenderCache(key: string): Graphics3DRenderCacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  // Refresh recency so animated playback retains the frames it is actively using.
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

export function set3DRenderCache(key: string, image: string): Graphics3DRenderCacheEntry {
  const entry = { key, image, createdAt: Date.now() };
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > maxEntries) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return entry;
}

/** Configure the maximum number of cached rendered frames. */
export function set3DRenderCacheLimit(limit: number): void {
  maxEntries = Math.max(1, Math.floor(limit));
  while (cache.size > maxEntries) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export function clear3DRenderCache(): void { cache.clear(); }

export function invalidate3DRenderCache(prefix?: string): void {
  if (!prefix) { cache.clear(); return; }
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
