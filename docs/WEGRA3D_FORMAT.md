# WEGRA3D Serialization Format

**Status:** Draft v0.1

## 1. Purpose

`.wegra3d` is the standalone, portable serialization format for a WEGRA 3D world. A world is a reusable resource that can be edited independently, embedded in a `.wegra` project, imported/exported, and rendered without requiring the parent project.

The format must preserve the world’s current state, its editing history, and its provenance. C2PA is an optional cryptographic representation of provenance and does not replace the internal provenance model.

## 2. Container

A `.wegra3d` file is a ZIP-based package. The canonical layout is:

```text
world.wegra3d
│
├── manifest.json
├── world.json
│
├── objects/
│   ├── object-001.json
│   └── ...
│
├── materials/
│   ├── material-001.json
│   └── ...
│
├── cameras/
│   ├── camera-001.json
│   └── ...
│
├── lights/
│   ├── light-001.json
│   └── ...
│
├── assets/
│   ├── models/
│   ├── textures/
│   ├── images/
│   └── ...
│
├── history/
│   └── operations.jsonl
│
└── provenance/
    ├── provenance.json
    └── c2pa/
        └── ...
```

The package layout is part of the format contract. Resource files are separated so that large worlds do not require a single monolithic JSON document.

## 3. Manifest

`manifest.json` identifies the package and indexes its major resources.

Example:

```json
{
  "format": "wegra3d",
  "version": "0.1",
  "worldId": "world-001",
  "world": "world.json",
  "resources": {
    "objects": "objects/",
    "materials": "materials/",
    "cameras": "cameras/",
    "lights": "lights/",
    "assets": "assets/"
  },
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
  }
}
```

The manifest should remain small and should describe package structure rather than duplicate world data.

## 4. World

`world.json` contains the world-level state and references to resources.

```json
{
  "id": "world-001",
  "name": "Church Interior",
  "version": 1,
  "coordinateSystem": {
    "up": "Y",
    "handedness": "right",
    "units": "meters"
  },
  "objects": ["object-001", "object-002"],
  "materials": ["material-001"],
  "cameras": ["camera-001"],
  "lights": ["light-001"]
}
```

The exact TypeScript world schema is the source for the concrete resource fields; this document defines serialization boundaries and invariants.

## 5. Objects

Objects are individually addressable resources under `objects/`.

Example:

```json
{
  "id": "object-001",
  "name": "Altar",
  "transform": {
    "position": [0, 1.2, -2],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  "geometry": {
    "type": "mesh",
    "asset": "asset://models/altar.glb"
  },
  "material": "material://material-001",
  "visible": true
}
```

Objects have stable IDs and may reference assets, materials, or other resources. Object serialization must not depend on filesystem paths.

## 6. Materials

Materials are individually addressable resources under `materials/`.

Example:

```json
{
  "id": "material-001",
  "name": "Oak",
  "shader": "pbr",
  "baseColor": [0.45, 0.25, 0.12, 1],
  "metallic": 0,
  "roughness": 0.65,
  "textures": {
    "baseColor": "asset://textures/oak.jpg"
  }
}
```

Serialization should remain renderer-neutral where practical.

## 7. Cameras

Cameras are individually addressable resources under `cameras/`.

Example:

```json
{
  "id": "camera-001",
  "name": "Main Camera",
  "projection": "perspective",
  "position": [0, 2, 8],
  "rotation": [0, 0, 0],
  "fov": 50,
  "near": 0.01,
  "far": 1000
}
```

A camera belongs to the world. A `.wegra` 3D View may reference a world camera without copying it.

## 8. Lights

Lights are individually addressable resources under `lights/`.

Example:

```json
{
  "id": "light-001",
  "type": "directional",
  "position": [5, 8, 5],
  "rotation": [0, 0, 0],
  "color": [1, 1, 1],
  "intensity": 2
}
```

## 9. Assets

Binary and other source assets are stored under `assets/` and referenced using stable asset URIs, for example:

```text
asset://models/altar.glb
asset://textures/oak.jpg
```

A world must be portable: references must not depend on absolute host filesystem paths.

Asset deduplication, hashing, external/linked assets, and asset metadata will be specified separately.

## 10. History

A WEGRA3D world has its own history under:

```text
history/operations.jsonl
```

Each operation has a **globally unique operation ID**. The history records actual world mutations, while `world.json` and resource files represent current state.

Example:

```json
{"id":"op_01JABC...","type":"create-object","objectId":"object-001","timestamp":"2026-08-29T12:00:00Z"}
{"id":"op_01JABD...","type":"set-transform","objectId":"object-001","property":"position","from":[0,0,0],"to":[0,1,0],"timestamp":"2026-08-29T12:00:02Z"}
```

History is not required to reconstruct the current world. It is an edit/evolution record and may be omitted from a package where appropriate.

When a WEGRA3D world is embedded in `.wegra`, the project-level history should **reference** world operations rather than duplicate them. A project history entry can contain:

```json
{
  "id": "op_01JABE...",
  "type": "world-operation",
  "worldId": "world-001",
  "operationId": "op_01JABD..."
}
```

This permits a unified chronological project history without copying world mutations into the project history.

## 11. Provenance

Internal provenance is stored under:

```text
provenance/provenance.json
```

It describes origin and derivation, not merely edit history.

Example:

```json
{
  "worldId": "world-001",
  "created": {
    "timestamp": "2026-08-29T12:00:00Z",
    "actor": {
      "type": "human"
    }
  },
  "derivation": [],
  "resources": {
    "object-001": {
      "derivedFrom": ["asset://models/altar.glb"]
    }
  }
}
```

History answers **what happened**. Provenance answers **where content came from and how it was derived**.

## 12. C2PA

C2PA is an optional cryptographic representation of provenance. It must not replace the WEGRA3D internal provenance model.

When present:

```text
provenance/
└── c2pa/
    └── ...
```

C2PA manifests/signatures may be generated from the internal provenance model and attached to exported/finalized content. Exact C2PA packaging and signing rules are intentionally deferred.

## 13. Stable IDs and references

Every important resource has a stable ID:

- world
- object
- material
- camera
- light
- asset
- operation

Operation IDs must be globally unique so that project history can safely reference world operations.

Logical references use URI-like namespaces:

```text
world://world-001
object://object-001
material://material-001
camera://camera-001
light://light-001
asset://models/altar.glb
```

IDs must not be derived from filenames.

## 14. Embedding in WEGRA

A `.wegra` project may contain complete WEGRA3D worlds under:

```text
worlds3d/
└── world-001/
    ├── world.json
    ├── objects/
    ├── materials/
    ├── cameras/
    ├── lights/
    ├── assets/
    ├── history/
    └── provenance/
```

The embedded world retains its world ID, resource IDs, history, and provenance. Importing a world must not flatten it into anonymous meshes/layers.

A future linked-resource form may allow a project to reference an external `.wegra3d` while retaining its origin information. The precise linked-resource semantics are not yet frozen.

## 15. Standalone import/export

A WEGRA3D package can be:

```text
created → saved → opened → edited → saved
```

and:

```text
WEGRA3D → imported into WEGRA
WEGRA3D ← exported from WEGRA
```

Import/export must preserve stable IDs and provenance where technically possible. If an operation cannot be preserved exactly across a format boundary, the import/export operation itself should be represented in provenance.

## 16. Versioning and compatibility

The package format has a top-level format version:

```json
{
  "format": "wegra3d",
  "version": "0.1"
}
```

Individual resources may have schema versions where necessary. Loaders must be prepared for format migrations rather than assuming that the current in-memory TypeScript structure is permanently identical to serialized JSON.

## 17. Non-goals of v0.1

The following are intentionally not frozen yet:

- exact mesh binary format
- external/linked asset semantics
- object hierarchy/parenting schema
- animation inside the world
- physics data
- renderer-specific extensions
- C2PA signing details
- collaborative/concurrent history semantics
- linked `.wegra3d` worlds

These can be added without changing the core package model.

## 18. Core invariant

A WEGRA3D package represents a **complete reusable world resource**:

```text
                WEGRA3D
                   │
                manifest
                   │
                 world
                   │
        ┌──────────┼──────────┐
        │          │          │
     objects   materials   cameras
        │                     │
     assets                lights
        │
        └─────────┬──────────┘
                  │
          ┌───────┴────────┐
          │                │
       history         provenance
                           │
                          C2PA
```

The serialized format follows the domain/resource model rather than mirroring React/editor state. This is a deliberate architectural requirement so that the same world can be edited by the graphical editor, serialized independently, embedded in a WEGRA project, rendered/exported, and eventually manipulated programmatically.