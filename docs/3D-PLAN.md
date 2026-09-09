# 3D Graphics Plan

## Goal

Add genuine 3D composition to the graphics editor while keeping the existing 2D document model clean and reusable.

The core abstraction is:

> **World = what exists. Camera = what sees it. View = how that view appears in the composition.**

A 3D world is reusable. Multiple cameras can observe the same world, and multiple views can place those camera outputs independently in the 2D canvas.

## Architecture

```text
GraphicsDocument
├── 2D layers
├── 3D worlds
│   ├── meshes
│   ├── lights
│   └── animation state
└── 3D views
    ├── worldId
    ├── cameraId
    ├── visibility/filter
    └── 2D canvas transform
```

## 3D view rendering modes

A 3D view supports:

```ts
renderMode: "auto" | "prerender" | "live"
```

`auto` is the default. In the dedicated 3D workspace the view is rendered live for editing; in the 2D composition workspace the view uses a cached/prerendered result so 3D rendering does not slow ordinary 2D editing.

`prerender` always uses cached output in the 2D composition. `live` keeps the Three.js view rendering continuously in the 2D composition.

The rendered image is a cache, never the source of truth. The source remains the world + camera + view definition. Cache keys include the source state, output dimensions and pixel ratio, so source changes naturally produce new frames.

## Animation

3D animation is stored as first-class timeline tracks. Evaluation produces a derived world without mutating the source document.

Supported animated properties include mesh transforms, camera transforms, camera FOV, and 3D view visibility/opacity.

The 2D composition evaluates the world at the current main-timeline time and renders the derived state. In cached modes, each requested animation time becomes a cacheable rendered frame. In live mode the renderer remains active and follows the timeline.

The animated frame cache is bounded with an LRU policy so long playback sessions do not grow memory without limit. Frequently revisited frames remain hot while older frames are evicted automatically.

## Implementation status

The 3D data model, renderer boundary, workspace, 3D composition layers, timeline evaluation, live rendering and static prerender caching are implemented. Animated cached rendering is also implemented: timeline time is evaluated before rendering, frame output is keyed by the evaluated source state/time, and the cache is bounded for sustained playback.

## AI/MCP readiness

MCP is not part of the initial 3D implementation. The model and operations remain programmatically accessible so a future AI/MCP layer can work with worlds, meshes, materials, lights, cameras, views, visibility, transforms, animation and composition through document operations.

## Architectural rules

1. **World, Camera and View are distinct concepts.**
2. **Arbitrary mesh is the foundational 3D geometry type.** Primitives generate meshes.
3. **3D transforms and 2D view transforms are separate.**
4. **The document format must not depend on Three.js.**
5. **Three.js is the rendering/interaction implementation, behind our boundary.**
6. **A world is reusable and may be referenced by multiple views.**
7. **A view controls what part of a world is shown and how it is composited.**
8. **3D depth and 2D layer order are different systems.**
9. **Serialization is versioned from the first 3D schema.**
10. **`.wegra` is the native complete project format; GLB/glTF are interchange formats.**
11. **Prerendering is a performance/cache strategy, never the source of truth.**
12. **3D animation tracks target stable world/view IDs and are evaluated as derived state.**
13. **The timeline is unified: 3D views are canvas objects, with nested mesh/camera tracks.**
14. **Keep MCP out of the initial implementation while preserving clean programmatic operations for it later.**
