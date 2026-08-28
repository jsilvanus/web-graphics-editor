# 3D Graphics Plan

## Goal

Add genuine 3D composition to the graphics editor while keeping the existing 2D document model clean and reusable.

The core abstraction is:

> **World = what exists. Camera = what sees it. View = how that view appears in the composition.**

A 3D world is reusable. Multiple cameras can observe the same world, and multiple views can place those camera outputs independently in the 2D canvas.

## Native project format and interchange

The native project format is **`.wegra`**. It is the complete editor project/container, not a special 3D-only format.

A `.wegra` project may contain:

```text
.wegra
├── document
├── 2D assets
├── 3D worlds
│   ├── meshes
│   ├── materials
│   ├── textures/assets
│   ├── cameras
│   └── lights
├── 3D views
├── timeline
├── provenance
└── other project data
```

3D worlds are first-class reusable content inside `.wegra`. They must not depend on Three.js serialization.

For interoperability with Blender and other 3D software, support **glTF/GLB** as interchange formats. GLB is especially useful as a single-file representation of a 3D world and its supported resources.

```text
.wegra ←→ editor model ←→ GLB/glTF ←→ Blender/other 3D tools
```

GLB/glTF export/import is an interoperability boundary and is not expected to preserve the complete `.wegra` project semantics. Unsupported information must be handled explicitly rather than silently pretending interchange is lossless.

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

### World

A world contains the persistent 3D content: arbitrary mesh objects, lights and eventually animation state.

A world is not itself a canvas layer.

### Camera

A camera belongs to a world and defines a viewpoint. A world may contain multiple cameras.

Support both perspective and orthographic projection.

### View

A view references a world and a camera and behaves like a normal 2D composition layer. It has its own 2D position, size, ordering and visibility/filter settings.

The same world can therefore appear multiple times in one composition, using different cameras and/or different visible object sets.

Example:

```text
World: Kitchen
├── Table
├── Kettle
├── Cup
├── Wide camera
└── Kettle camera

Canvas
├── Wide view → Kitchen / Wide camera / all objects
├── White paper
└── Kettle view → Kitchen / Kettle camera / kettle + cup
```

## Geometry model

The foundational 3D object is an **arbitrary mesh**, not a collection of special primitive object types.

Conceptually:

```ts
Mesh {
  vertices
  indices
  normals?
  uv?
  material
}
```

Geometry must be renderer-independent and serializable. Do not persist Three.js internal geometry objects or classes.

Cubes, spheres, cylinders, cones and similar primitives are convenience tools that generate ordinary mesh geometry.

This allows future support for:

- user-created meshes
- procedural meshes
- imported models
- extruded 2D geometry
- AI-generated geometry
- mesh editing operations

## Provenance

3D entities may carry renderer-independent provenance metadata describing where the content came from. This is part of the document model rather than a renderer concern.

```ts
Provenance {
  source: "user" | "generated" | "imported" | "derived" | "ai"
  createdBy?
  sourceId?
  sourceUri?
  parentIds?
  createdAt?
}
```

Provenance should be preserved through serialization and used by future import, derivation and AI/MCP workflows.

## Renderer

Use **Three.js** as the planned real-3D renderer and interaction engine.

Three.js must remain behind an editor-owned renderer boundary:

```text
Graphics3DWorld + Camera + View
              ↓
      editor 3D renderer API
              ↓
           Three.js
```

The document model must not depend on Three.js. This keeps serialized documents stable and allows the rendering implementation to change later if necessary.

We do not need to build a custom 2.5D renderer first. The first implementation uses Three.js directly for genuine 3D, starting with simple generated meshes.

## 3D workspace

Provide a dedicated 3D editing view rather than turning the main 2D canvas into a full 3D editor.

Initial capabilities:

- orbit/pan/zoom editor camera
- select mesh objects
- move/rotate/scale objects
- inspect transform and geometry properties
- create/delete objects
- create/select cameras
- position cameras
- switch perspective/orthographic projection
- basic lighting controls

The editor workspace camera is an editing tool and should not be confused with cameras stored in the world.

## Visibility

Views need independent visibility filtering so different views can show different parts of the same world.

Start with an explicit include/exclude model:

```ts
visibility: {
  mode: "all" | "include" | "exclude"
  objects: string[]
}
```

Later, support named visibility groups such as `Furniture`, `Characters`, `Props`, `Effects` and `Background` if useful.

## Layering and composition

3D depth and 2D composition order are separate concepts.

- Objects inside a world have real 3D positions and are rendered according to the camera.
- A 3D view has normal 2D canvas ordering and can be placed above or below ordinary 2D layers.
- Optional explicit 3D render ordering may be added later for overlays/highlights, but should not replace physical depth.

This allows multiple overlapping views of the same world and ordinary 2D elements to mask or overlay them.

## Animation

3D object transforms and stored camera transforms should eventually integrate with the existing timeline.

Support, as needed:

- object position/rotation/scale animation
- camera position/rotation/FOV animation
- visibility animation
- shared animation state when the same world is used by multiple views

The same animated world should be able to feed several camera views at the same timeline time.

## Implementation phases

### Phase 1 — 3D data model

- [x] Define versioned `Graphics3DWorld` data
- [x] Define renderer-independent mesh geometry
- [x] Define 3D transforms
- [x] Define cameras
- [x] Define lights
- [x] Define 3D views
- [x] Define visibility filtering
- [x] Add serialization/deserialization
- [x] Add document operations for creating/updating/removing 3D entities
- [x] Add unit tests
- [x] Add provenance metadata to the 3D model

### Phase 2 — Three.js renderer

- [x] Add Three.js dependency
- [x] Create editor-owned 3D renderer interface
- [x] Map mesh geometry to Three.js objects
- [x] Map transforms
- [x] Implement perspective/orthographic cameras
- [x] Implement basic lights/materials
- [x] Render simple generated meshes
- [x] Add renderer tests where practical

The initial renderer is deliberately an adapter rather than part of the document model. Three.js rotations are currently interpreted as radians; the serialized model remains independent of Three.js.

### Phase 3 — 3D workspace

- [x] Dedicated 3D workspace/view
- [x] Editor orbit/pan/zoom camera
- [x] Object selection/raycasting
- [x] Transform controls for move/rotate/scale
- [x] Object transform inspector
- [x] Mesh creation/deletion (initial box generator)
- [x] Camera management and projection selection
- [x] Basic light management
- [ ] Rich geometry/material inspector
- [ ] Persist and edit full camera orientation/FOV in the workspace UI
- [ ] Browser tests for the workspace

### Phase 4 — 3D views in the 2D editor

- [ ] Add 3D view as a canvas layer
- [ ] Select world/camera
- [ ] Place/resize the view
- [ ] Normal 2D layer ordering
- [ ] Include/exclude visibility filtering
- [ ] Multiple views referencing one world
- [ ] Serialize complete composition

### Phase 5 — Arbitrary mesh workflows and interchange

- [ ] Generic mesh editing foundations
- [ ] Vertex/edge/face selection as justified by use cases
- [ ] Basic operations such as extrude, inset, merge and delete
- [ ] Procedural primitive generators
- [ ] Native `.wegra` packaging of 3D assets and resources
- [ ] GLB import/export
- [ ] glTF import/export
- [ ] Mesh/material/texture conversion
- [ ] Camera conversion
- [ ] Light conversion
- [ ] Animation conversion
- [ ] Preserve provenance where possible
- [ ] Clearly report information lost during interchange

Do not attempt to reproduce Blender wholesale. Add operations according to actual graphics-editor needs.

### Phase 6 — Timeline integration

- [ ] Animate object transforms
- [ ] Animate camera transforms
- [ ] Animate visibility
- [ ] Render multiple views from the same animated world
- [ ] Ensure shared-world animation remains consistent

### Phase 7 — Advanced rendering

As needed:

- [ ] richer materials
- [ ] textures
- [ ] shadows
- [ ] advanced lights
- [ ] environment/backgrounds
- [ ] model import
- [ ] WebGPU/other renderer improvements if justified

## AI/MCP readiness

Do not implement MCP as part of the initial 3D work.

However, the model and operations must remain programmatically accessible and semantic enough that a future AI/MCP layer can work with:

```text
worlds
meshes
vertices/faces
materials
lights
cameras
views
visibility
transforms
animation
composition
```

AI should eventually be able to create and modify graphics through document operations rather than UI automation.

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
10. **Provenance is first-class metadata and must survive serialization.**
11. **`.wegra` is the complete native project format; GLB/glTF are interchange formats.**
12. **Keep MCP out of the initial implementation while preserving clean programmatic operations for it later.**
