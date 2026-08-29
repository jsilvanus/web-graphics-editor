# WEGRA Serialization Format

**Status:** Draft v0.1

## 1. Purpose

`.wegra` is the canonical native project format for the Web Graphics Editor. It is a complete graphics composition package containing 2D document state, scenes and timelines, 3D views, embedded reusable 3D worlds, assets, history, and provenance.

The format is a serialization of the **document/domain model**, not React state or renderer state. A `.wegra` project must be loadable without the editor UI and must remain suitable for future programmatic editing and AI/MCP access.

The format complements `.wegra3d`: `.wegra3d` is a standalone reusable 3D world; `.wegra` is the complete composition/project that may contain zero or more embedded worlds.

## 2. Container

A `.wegra` file is a ZIP-based package.

Canonical structure:

```text
project.wegra
│
├── manifest.json
├── document.json
│
├── scenes/
│   ├── scene-001.json
│   └── ...
│
├── timelines/
│   ├── main.json
│   └── ...
│
├── objects/
│   ├── layer-001.json
│   └── ...
│
├── worlds3d/
│   ├── world-001/
│   │   ├── world.json
│   │   ├── objects/
│   │   ├── materials/
│   │   ├── cameras/
│   │   ├── lights/
│   │   ├── assets/
│   │   ├── history/
│   │   └── provenance/
│   │
│   └── world-002/
│       └── ...
│
├── assets/
│   ├── images/
│   ├── video/
│   ├── audio/
│   ├── fonts/
│   └── ...
│
├── history/
│   └── operations.jsonl
│
├── provenance/
│   ├── provenance.json
│   ├── actors.json
│   └── c2pa/
│       └── ...
│
└── preview/
    └── ...
```

A package does not have to contain every optional directory. `manifest.json` declares what is present.

## 3. Core model

The project has one composition document:

```text
GraphicsDocument
│
├── canvas
│   ├── width
│   ├── height
│   └── background
│
├── 2D layers
│
├── scenes
│   └── timeline
│       ├── scenes
│       ├── 2D tracks
│       ├── 3D tracks
│       └── layer clips
│
├── 3D worlds
│
├── 3D views
│
└── assets
```

The existing TypeScript model already establishes `GraphicsDocument`, scenes/timeline, 3D worlds and 3D views; the native format gives those entities stable serialized boundaries. fileciteturn121file0L2-L2

The architectural rule remains:

> **World = what exists. Camera = what sees it. View = how that view appears in the composition.**

A 3D view is a normal 2D composition object. It references a `worldId` and `cameraId`; it does not copy the world. Multiple views may reference the same world. fileciteturn125file0L2-L2

## 4. `manifest.json`

The manifest identifies the package and its major resources.

Example:

```json
{
  "format": "wegra",
  "version": "0.1",
  "document": "document.json",
  "objects": "objects/",
  "scenes": "scenes/",
  "timelines": "timelines/",
  "worlds3d": "worlds3d/",
  "assets": "assets/",
  "history": {
    "present": true,
    "path": "history/operations.jsonl"
  },
  "provenance": {
    "present": true,
    "path": "provenance/provenance.json"
  },
  "c2pa": {
    "present": false
  },
  "preview": {
    "present": false
  }
}
```

The manifest is package metadata and indexing information. It should not duplicate the complete document state.

## 5. `document.json`

`document.json` contains project-level composition state that is not more naturally represented as an independently addressable resource.

Conceptually:

```json
{
  "id": "project-001",
  "name": "Example Project",
  "width": 1920,
  "height": 1080,
  "background": "#000000",
  "layers": ["layer-001", "layer-002", "view-001"],
  "scenes": ["scene-001"],
  "timeline": "timelines/main.json",
  "worlds3d": ["world-001"],
  "views3d": ["view-001"],
  "assets": ["asset-001"]
}
```

The exact split between `document.json` and resource files may evolve, but serialized state must remain declarative and renderer-independent.

## 6. 2D objects/layers

2D layers are independently addressable resources under `objects/`.

A layer has a stable ID and contains its geometry/content/presentation properties.

The layer order in the composition is significant. It is separate from temporal presence.

For example:

```text
layer order:

Background
Title
Logo
3D View
```

Moving a layer in time does **not** change this order.

## 7. Scenes

Scenes are first-class timeline/composition resources under `scenes/`.

A scene has at least:

```text
id
name
start
duration
transition?
```

Scene transitions are temporal composition behavior, not z-order changes.

Current scene/timeline concepts are already represented by `Scene`, `SceneTimeline`, `LayerClip`, tracks and keyframes in the domain model. fileciteturn121file0L2-L2

## 8. Timeline

The project has **one unified timeline and one playhead** for 2D and 3D content.

`timelines/main.json` contains timeline state such as:

```json
{
  "scenes": ["scene-001"],
  "currentSceneId": "scene-001",
  "tracks": [],
  "tracks3d": [],
  "clips": [],
  "loop": false
}
```

Timeline entities have stable IDs.

### Keyframe rule

Animation is explicit at the track level. Once a property is animated, an edit at playhead time `T` updates an existing keyframe at `T` or creates a new keyframe at exactly `T`.

Static properties do not silently become animated merely because the user edits them.

This distinction is important for both UI behavior and programmatic operations.

### Temporal presence

A `LayerClip` controls when a layer is present:

```text
start
duration
```

Temporal presence is independent of layer/z-order.

A future transition such as fade or dissolve operates at temporal boundaries and does not change layer ordering.

## 9. 3D views

A 3D view is a composition resource, not a world.

Conceptually:

```json
{
  "id": "view-001",
  "name": "Wide Shot",
  "worldId": "world-001",
  "cameraId": "camera-001",
  "visibility": {
    "mode": "all",
    "objects": []
  },
  "renderMode": "auto",
  "x": 100,
  "y": 100,
  "width": 800,
  "height": 450,
  "rotation": 0,
  "opacity": 1
}
```

The 3D view has a 2D canvas transform and normal composition ordering. The world objects retain their genuine 3D transforms inside the embedded world.

A world may be referenced by multiple views with different cameras and visibility filters. fileciteturn125file0L2-L2

## 10. Embedded worlds3d

`.wegra` contains zero or more complete WEGRA3D worlds under:

```text
worlds3d/<world-id>/
```

The contents of each directory follow the `.wegra3d` resource structure documented in `WEGRA3D_FORMAT.md`.

An embedded world is therefore a first-class reusable project resource rather than a flattened collection of meshes.

Example:

```text
worlds3d/
├── world-kitchen/
│   ├── world.json
│   ├── objects/
│   ├── materials/
│   ├── cameras/
│   ├── lights/
│   ├── assets/
│   ├── history/
│   └── provenance/
│
└── world-studio/
    └── ...
```

A world can consequently be extracted/exported as a standalone `.wegra3d` package without losing its identity, internal history or provenance.

## 11. Assets

Project-level assets are stored under `assets/` and referenced by stable asset IDs/URIs rather than host filesystem paths.

World-local assets may be stored inside their respective `worlds3d/<world-id>/assets/` directory when they belong specifically to that world.

If an asset is shared by multiple project resources, it should be stored at project level and referenced from there rather than duplicated.

The format should support later content-addressed asset deduplication without changing logical asset IDs.

## 12. History

`.wegra` has a **project-level chronological history** under:

```text
history/operations.jsonl
```

The history records project-level operations and references operations performed inside embedded worlds rather than duplicating those world operations.

Example project history entry:

```json
{
  "id": "op-project-42",
  "timestamp": "2026-08-29T12:00:00Z",
  "actor": "actor-001",
  "label": "Move 3D chair",
  "operation": {
    "type": "world-operation",
    "worldId": "world-kitchen",
    "operationId": "op-world-187"
  }
}
```

The actual world mutation lives in:

```text
worlds3d/world-kitchen/history/operations.jsonl
```

This provides one chronological project history without duplicating world operations.

### Global operation IDs

Operation IDs are globally unique across WEGRA and WEGRA3D packages. This allows project history, world history and provenance records to refer to an operation unambiguously.

### Undo/redo

The serialized history is not necessarily identical to the editor's in-memory undo stack. The operation model is the persistent edit record; editor-specific caches/checkpoints may be rebuilt or omitted.

## 13. Provenance

Project provenance is stored under:

```text
provenance/
├── provenance.json
└── actors.json
```

Provenance records origin and derivation, rather than simply recording edits.

It may identify:

- project creation
- imported resources
- derived resources
- actors
- source identifiers/URIs
- relationships between project resources and source resources
- AI/generated content
- export/derivation events

Actor identity should be represented through stable/pseudonymous identifiers where appropriate rather than embedding unnecessary personal information.

Embedded worlds retain their own provenance under their `worlds3d/<world-id>/provenance/` directory.

## 14. C2PA

C2PA is an optional cryptographic layer over provenance.

It does not replace the internal WEGRA provenance model.

The relationship is:

```text
WEGRA / WEGRA3D provenance
          │
          ▼
     C2PA manifest
          │
          ▼
 signed export/output
```

Project-level C2PA material belongs under:

```text
provenance/c2pa/
```

A world may independently contain C2PA material under its own provenance directory.

Exact C2PA signing/manifest rules are deliberately deferred until the internal provenance model is stable.

## 15. Stable IDs and references

The following entities have stable IDs:

- project
- layer
- scene
- track
- keyframe
- clip
- 3D view
- 3D world
- 3D world object
- camera
- light
- material
- asset
- operation
- actor

Logical references should use explicit namespaces where useful:

```text
project://project-001
layer://layer-001
scene://scene-001
track://track-001
keyframe://keyframe-001
clip://clip-001
view://view-001
world://world-001
asset://asset-001
operation://op-01J...
```

A serialized path such as `worlds3d/world-001/...` is a package location, not the entity's identity.

## 16. Importing `.wegra3d`

Importing a standalone `.wegra3d` into `.wegra` incorporates the world as a first-class resource:

```text
world.wegra3d
      │
      ▼
project.wegra
      │
      └── worlds3d/world-001/
```

The world retains its stable IDs, history and provenance.

The project history records the import and subsequent world operations by reference.

The import event itself is also a provenance event because it establishes a derivation relationship between the source package and the project resource.

## 17. Exporting `.wegra3d`

A world embedded in `.wegra` can be exported as a standalone `.wegra3d`.

The export should preserve:

- world ID
- world resource IDs
- world history
- world provenance
- world-local assets

Project-specific references are not copied into the standalone world unless they are meaningful to the world itself. The export event may be recorded in project provenance.

## 18. Preview/cache data

Preview images, rendered 3D view results and other derived render caches are **not source-of-truth document data**.

They may be stored under `preview/` or other explicitly cache-designated paths.

A renderer must be able to discard and regenerate these caches from the serialized document/world state.

This follows the 3D architecture rule that rendered output is a cache and the world + camera + view definition remain authoritative. fileciteturn125file0L2-L2

## 19. Versioning and migration

The top-level package has a format version independent of application/editor version:

```json
{
  "format": "wegra",
  "version": "0.1"
}
```

Future incompatible schema changes require a migration path.

The implementation should maintain an explicit migration registry rather than scattering compatibility logic through UI code. The existing project plan already identifies deterministic/canonical serialization and an explicit migration registry as remaining serialization work. fileciteturn124file0L2-L2

## 20. Determinism

The serializer should aim for deterministic output:

- stable resource ordering
- stable JSON property ordering where practical
- stable IDs
- no UI-state-dependent data
- no renderer object serialization
- no timestamps generated merely by serializing

Deterministic serialization is important for testing, version comparison, provenance and future content-addressed storage.

## 21. Non-goals of v0.1

The following remain intentionally open:

- exact asset hashing/content-addressing scheme
- linked external `.wegra3d` worlds versus embedded copies
- collaborative/concurrent history semantics
- exact C2PA manifest/signature packaging
- binary mesh storage policy beyond WEGRA3D
- editor UI state persistence
- renderer-specific cache formats
- application/host-specific metadata

## 22. Core invariant

A `.wegra` package is a **complete graphics project**, while each embedded `.wegra3d` directory is a **complete reusable 3D world**.

```text
                         WEGRA
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       document         timeline          assets
          │                │
       2D layers      scenes/tracks
          │                │
          └────────┬───────┘
                   │
                 views
                   │
          ┌────────┴────────┐
          ▼                 ▼
       World A           World B
          │                 │
      WEGRA3D            WEGRA3D
          │                 │
      objects/...       objects/...

        history + provenance at each resource scope
```

The format must preserve the distinction between composition, world content, history and provenance while keeping all meaningful entities stable and programmatically addressable.