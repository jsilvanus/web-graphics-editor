import { afterEach, describe, expect, it } from "vitest";
import { clear3DRenderCache, get3DRenderCache, set3DRenderCache, set3DRenderCacheLimit } from "./3d-render-cache";

describe("3D render cache", () => {
  afterEach(() => {
    set3DRenderCacheLimit(120);
    clear3DRenderCache();
  });

  it("keeps recently used animated frames and evicts the oldest frame", () => {
    set3DRenderCacheLimit(2);
    set3DRenderCache("frame-0", "a");
    set3DRenderCache("frame-1", "b");
    expect(get3DRenderCache("frame-0")?.image).toBe("a");

    set3DRenderCache("frame-2", "c");

    expect(get3DRenderCache("frame-0")?.image).toBe("a");
    expect(get3DRenderCache("frame-1")).toBeUndefined();
    expect(get3DRenderCache("frame-2")?.image).toBe("c");
  });

  it("replaces an existing frame without increasing cache size", () => {
    set3DRenderCacheLimit(1);
    set3DRenderCache("frame", "old");
    set3DRenderCache("frame", "new");

    expect(get3DRenderCache("frame")?.image).toBe("new");
  });
});
