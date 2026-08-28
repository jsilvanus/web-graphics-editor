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

We do not need to build a custom 2.5D renderer first. The first implementation should use Three.js directly for genuine 3D, starting with simple generated meshes.

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

- [ ] Define versioned `Graphics3DWorld` data
- [ ] Define renderer-independent mesh geometry
- [ ] Define 3D transforms
- [ ] Define cameras
- [ ] Define lights
- [ ] Define 3D views
- [ ] Define visibility filtering
- [ ] Add serialization/deserialization
- [ ] Add document operations for creating/updating/removing 3D entities
- [ ] Add unit tests

No Three.js dependency is required for this phase.

### Phase 2 — Three.js renderer

- [ ] Add Three.js dependency
- [ ] Create editor-owned 3D renderer interface
- [ ] Map mesh geometry to Three.js objects
- [ ] Map transforms
- [ ] Implement perspective/orthographic cameras
- [ ] Implement basic lights/materials
- [ ] Render simple generated meshes
- [ ] Add renderer tests where practical

### Phase 3 — 3D workspace

- [ ] Dedicated 3D workspace/view
- [ ] Editor orbit camera
- [ ] Object selection/raycasting
- [ ] Transform controls
- [ ] Object inspector
- [ ] Mesh creation/deletion
- [ ] Camera management
- [ ] Light management

### Phase 4 — 3D views in the 2D editor

- [ ] Add 3D view as a canvas layer
- [ ] Select world/camera
- [ ] Place/resize the view
- [ ] Normal 2D layer ordering
- [ ] Include/exclude visibility filtering
- [ ] Multiple views referencing one world
- [ ] Serialize complete composition

### Phase 5 — Arbitrary mesh workflows

- [ ] Generic mesh editing foundations
- [ ] Vertex/edge/face selection as justified by use cases
- [ ] Basic operations such as extrude, inset, merge and delete
- [ ] Procedural primitive generators
- [ ] Mesh import where useful
- [ ] Material/UV improvements

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
10. **Keep MCP out of the initial implementation while preserving clean programmatic operations for it later.**
