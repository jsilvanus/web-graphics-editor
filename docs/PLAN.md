# Web Graphics Editor — Plan

## Goal

Build a reusable, framework-independent graphics editing foundation that can be consumed by multiple applications and can grow into a family of editor packages.

The first editor is the graphics editor extracted from `saarnavideo` / `live-captions-yt`. Future editors may include a video timeline editor and other media-oriented editors.

## Architecture

The repository is a monorepo:

```text
apps/
  demo/                         # small development/demo application

packages/
  graphics-editor/              # reusable React graphics editor
  video-timeline-editor/         # future
  ...                           # future editors
```

### Technology

- TypeScript
- React 19
- Vite
- ESM packages with generated TypeScript declarations
- Vitest + React Testing Library
- Playwright for editor-level browser tests
- No Next.js dependency in the editor packages
- Avoid introducing a state-management library until the editor's state model demonstrates a need for one

The demo is a Vite/React application. Consumers may be Vite, Next.js, or another React application.

## Core design principles

### 1. The editor is reusable

The package must not know about a host application's projects, users, authentication, database, API routes, file storage, or framework-specific routing. Host-specific integrations are supplied through props, callbacks, adapters, or explicitly optional integration packages.

### 2. The document model is first-class

The graphics document is the contract between the editor and the host application.

```ts
GraphicsDocument
  width
  height
  background
  layers[]
```

Layers contain geometry, type, content and presentation data. The editor edits the document and reports changes through `onChange`.

Assets are supplied by the host:

```ts
GraphicsAsset
  id
  name
  url
  type
```

The editor must not construct application-specific asset URLs.

### 3. Keep editing atomic

`GraphicsEditor` primarily coordinates document state, selection and editor-level commands. Detailed UI and interaction behavior belongs in small components.

### 4. Future 3D architecture

3D should extend the document model without turning the 2D canvas into a fundamentally 3D editor. The core abstraction is:

> **World = what exists. Camera = what sees it. View = how that view appears in the composition.**

A document may contain multiple reusable 3D worlds and multiple 3D views. A view references a world and camera and behaves as a layer in the 2D composition.

Conceptually:

```text
GraphicsDocument
├── 2D layers
├── 3D worlds
│   ├── meshes
│   ├── lights
│   └── animation
└── 3D views
    ├── worldId
    ├── cameraId
    ├── visibility/filter
    └── 2D canvas transform
```

The same world may be viewed by several cameras and placed into the canvas several times. Views may select or exclude objects independently, allowing compositions such as a wide kitchen shot and a kettle close-up from the same animated world.

3D object transforms are separate from the 2D transform of the view. A 3D view is positioned, sized, ordered and composited like other canvas layers; objects inside the world have genuine 3D transforms.

The underlying 3D geometry model must support **arbitrary meshes**. Cubes, cylinders, spheres and similar primitives are convenience generators, not foundational object types. The persisted document format must not depend on a rendering library's internal geometry representation.

The planned real-3D renderer is **Three.js**, behind an editor-owned renderer boundary. Three.js is a rendering/interaction implementation detail, not the document model. This leaves room to change rendering technology later without changing serialized documents or the host integration API.

### Planned 3D progression

1. Define versioned `Graphics3DWorld`, mesh, camera, light and view data structures.
2. Add arbitrary, renderer-independent mesh geometry and serialization.
3. Add a Three.js-based renderer and basic generated meshes.
4. Add a dedicated 3D workspace for scene/object/camera editing.
5. Add 3D views as normal 2D composition layers, including visibility filtering and multiple views of one world.
6. Integrate 3D object and camera animation with the timeline.
7. Add richer arbitrary-mesh editing/import, materials, lighting and other 3D capabilities as needed.
8. Keep the model and operations structured so a future AI/MCP interface can create and modify worlds, meshes, cameras, views and composition without depending on UI details.

Do not implement MCP as part of the initial 3D work. Preserve programmatic accessibility and clean editing operations for later.

## Current structure

```text
src/
├── GraphicsEditor.tsx
├── types.ts
├── constants.ts
├── geometry.ts
├── document.ts
├── serialization.ts
│
├── components/
│   ├── GraphicsEditorToolbar.tsx
│   ├── LayerList.tsx
│   │
│   ├── canvas/
│   │   ├── GraphicsEditorCanvas.tsx
│   │   ├── CanvasLayer.tsx
│   │   ├── SelectionOverlay.tsx
│   │   ├── ResizeHandles.tsx
│   │   └── RotateHandle.tsx
│   │
│   └── properties/
│       ├── LayerProperties.tsx
│       ├── TransformProperties.tsx
│       ├── TextProperties.tsx
│       ├── ShapeProperties.tsx
│       ├── ImageProperties.tsx
│       └── AnimationProperties.tsx
│
└── hooks/
    ├── useCanvasInteraction.ts
    ├── useEditorHistory.ts
    ├── useEditorKeyboard.ts
    ├── useEditorSelection.ts
    ├── useEditorTransaction.ts
    └── useLayerOperations.ts
```

## Phase 1 — Extract and stabilize the graphics editor

- [x] Create monorepo
- [x] Create reusable `graphics-editor` package
- [x] Create Vite demo
- [x] Establish `GraphicsDocument`, `Layer`, and `GraphicsAsset` types
- [x] Extract toolbar
- [x] Extract canvas
- [x] Extract layer list
- [x] Extract atomic property components
- [x] Extract atomic canvas rendering/interaction components
- [x] Extract geometry helpers
- [x] Remove Saarnavideo API/project assumptions from the editor package
- [ ] Replace component-local prototype styling with package styling
- [x] Add unit tests for geometry and document operations
- [ ] Add interaction tests for selection, movement, resize and rotation
- [x] Make the demo exercise the public package API

## Phase 2 — Editor interaction model

The basic interaction model is now present and should be hardened with browser tests:

- [x] single selection
- [x] additive/multi-selection
- [x] deselection
- [x] layer movement
- [x] grid snapping
- [x] resize handles
- [x] aspect-ratio locking
- [x] rotation
- [x] rotation snapping
- [x] duplicate
- [x] delete
- [x] keyboard shortcuts
- [ ] z-order/layer ordering
- [x] undo/redo history
- [ ] interaction/browser tests

## Phase 3 — Layer/property model

### Text

- [x] content
- [x] font family
- [x] size
- [x] weight
- [x] alignment
- [x] color
- [x] opacity
- [x] shadow
- [x] stroke
- [x] animation

### Shapes

- [x] rectangle
- [x] ellipse
- [x] fill/background
- [x] opacity
- [x] border/stroke
- [x] rotation

### Images

- [x] asset selection
- [x] source URL supplied by host
- [x] sizing
- [x] object fit
- [x] opacity
- [x] rotation

### Common transform

- [x] x/y
- [x] width/height
- [x] rotation
- [x] aspect-ratio lock

## Phase 4 — Serialization and compatibility

The generic package now has a versioned JSON boundary. Deserialization also accepts the `rect` layer type used by the extracted Saarnavideo editor and normalizes it to `rectangle`.

- [x] JSON serialization
- [x] document version
- [x] compatibility normalization for legacy `rect`
- [x] serialization tests
- [ ] deterministic/canonical serialization policy
- [ ] explicit migration registry for future schema versions

## Phase 5 — Rendering/export boundary

Keep editing and rendering separate enough that a document can eventually be rendered outside the interactive editor.

Potential future capabilities:

- preview rendering
- PNG export
- SVG export where applicable
- server-side rendering
- video overlay rendering
- thumbnails

Do not prematurely introduce a rendering engine. First stabilize the document model and DOM/CSS editor.

## Phase 6 — Package API

The public package currently exposes the editor, document types, default document, and stable serialization helpers:

```ts
import {
  GraphicsEditor,
  deserializeGraphicsDocument,
  serializeGraphicsDocument,
  type GraphicsDocument,
  type GraphicsAsset,
  type Layer,
} from "@jsilvanus/graphics-editor";
```

Internal implementation components do not automatically become public API.

## Phase 7 — Integration with existing applications

After the standalone editor is stable:

1. Replace the copied editor in `saarnavideo` with the package.
2. Replace the editor in `live-captions-yt` where appropriate.
3. Adapt each application's asset/project integration at the host boundary.
4. Verify that existing `.svgraphic` or other application-specific persistence formats are handled by application integration or a dedicated adapter rather than embedded in the generic editor.

The goal is to have one editor implementation rather than maintaining copies in multiple applications.

## Future editors

Potential packages:

```text
@jsilvanus/graphics-editor
@jsilvanus/video-timeline-editor
@jsilvanus/audio-editor
```

Shared packages such as `editor-core`, `media-model`, or `editor-ui` should only be created after real duplication appears.

## Current next step

Do a stabilization pass before expanding the feature set:

1. Add interaction/browser tests for selection, movement, resize, rotation, and undo/redo.
2. Add z-order/layer ordering.
3. Finish package-level styling cleanup.
4. Add an application-side adapter example showing how Saarnavideo's `item.data.layers` becomes a `GraphicsDocument` without putting Saarnavideo concerns into the generic package.
5. Then replace Saarnavideo's copied graphics editor with the package.

The 3D work should begin only after the core editor stabilization/integration boundary is sufficiently solid, while the architecture above should guide the document and API decisions made before then.
