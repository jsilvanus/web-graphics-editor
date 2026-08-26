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

The package must not know about a host application's:

- projects
- users
- authentication
- database
- API routes
- file storage
- framework-specific routing

Host-specific integrations are supplied through props, callbacks, adapters, or explicitly optional integration packages.

### 2. The document model is first-class

The graphics document is the contract between the editor and the host application.

```ts
GraphicsDocument
  width
  height
  background
  layers[]
```

Layers contain their geometry, type, content and presentation data. The editor edits the document and reports changes through `onChange`.

Assets are similarly supplied by the host:

```ts
GraphicsAsset
  id
  name
  url
  type
```

The editor must not construct application-specific asset URLs.

### 3. Keep editing atomic

`GraphicsEditor` should primarily coordinate document state, selection and editor-level commands. Detailed UI and interaction behavior belongs in small components.

Target structure:

```text
src/
├── GraphicsEditor.tsx
├── types.ts
├── constants.ts
├── geometry.ts
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
│       ├── AnimationProperties.tsx
│       └── AssetPicker.tsx
│
└── ...
```

Components should have narrow responsibilities and communicate through explicit props/callbacks rather than reaching into application state.

## Phase 1 — Extract and stabilize the graphics editor

- [x] Create monorepo
- [x] Create reusable `graphics-editor` package
- [x] Create Vite demo
- [x] Establish `GraphicsDocument`, `Layer`, and `GraphicsAsset` types
- [x] Extract toolbar
- [x] Extract canvas
- [x] Extract layer list
- [x] Extract initial layer properties component
- [x] Extract geometry helpers
- [ ] Split `LayerProperties` into atomic property components
- [ ] Split canvas into atomic rendering/interaction components
- [ ] Remove all remaining host/application-specific assumptions
- [ ] Add proper editor styling rather than component-local prototype styling
- [ ] Add unit tests for geometry and document operations
- [ ] Add interaction tests for selection, movement, resize and rotation
- [ ] Make the demo exercise the public package API

### Property component extraction

`LayerProperties` should become a coordinator for type-independent and type-specific property panels.

```text
LayerProperties
├── TransformProperties
├── TextProperties       # text only
├── ShapeProperties      # rectangle / ellipse
├── ImageProperties      # image only
└── AnimationProperties
```

Asset selection belongs in `AssetPicker` and receives the available assets from the host.

### Canvas component extraction

The canvas should separate rendering from interaction mechanics:

```text
GraphicsEditorCanvas
├── CanvasLayer
├── SelectionOverlay
│   ├── ResizeHandles
│   └── RotateHandle
└── guides/grid/safe-area overlays
```

The canvas should deal in logical document coordinates. Browser scaling must remain an implementation detail of the canvas.

## Phase 2 — Editor interaction model

Implement and stabilize:

- single selection
- additive/multi-selection
- deselection
- layer movement
- grid snapping
- resize handles
- aspect-ratio locking
- rotation
- rotation snapping
- duplicate
- delete
- keyboard shortcuts
- z-order/layer ordering
- undo/redo history

Interaction logic should be reusable and testable independently from presentation components where practical.

## Phase 3 — Layer/property model

Support the existing graphics use cases cleanly:

### Text

- content
- font family
- size
- weight
- alignment
- color
- opacity
- shadow
- stroke
- animation

### Shapes

- rectangle
- ellipse
- fill/background
- opacity
- border/stroke as appropriate
- rotation

### Images

- asset selection
- source URL supplied by host
- sizing
- object fit
- opacity
- rotation

### Common transform

- x/y
- width/height
- rotation
- aspect-ratio lock

## Phase 4 — Serialization and compatibility

Define a stable serialized document format.

Requirements:

- JSON serializable
- versionable
- deterministic enough for testing/diffing
- backwards-compatible migration path
- independent of React

Add:

- `serializeGraphicsDocument()`
- `deserializeGraphicsDocument()`
- document version
- migration functions when the schema changes

Do not make React component state the persistence format.

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

The public package should expose only deliberate public APIs.

Initial target:

```ts
import {
  GraphicsEditor,
  type GraphicsDocument,
  type GraphicsAsset,
  type Layer,
} from "@jsilvanus/graphics-editor";
```

Internal implementation components should not automatically become public API.

Document helpers can be exported separately when stable.

## Phase 7 — Integration with existing applications

After the standalone editor is stable:

1. Replace the copied editor in `saarnavideo` with the package.
2. Replace the editor in `live-captions-yt` where appropriate.
3. Adapt each application's asset/project integration at the host boundary.
4. Verify that existing `.svgraphic` or other application-specific persistence formats are handled by application integration or a dedicated adapter rather than embedded in the generic editor.

The goal is to have one editor implementation rather than maintaining copies in multiple applications.

## Future editors

The monorepo is deliberately not named around the graphics editor alone at the package/repository architecture level.

Potential packages:

```text
@jsilvanus/graphics-editor
@jsilvanus/video-timeline-editor
@jsilvanus/audio-editor
```

They may eventually share lower-level packages if useful:

```text
@jsilvanus/editor-core
@jsilvanus/media-model
@jsilvanus/editor-ui
```

Do **not** create these shared packages until there is real duplication. Prefer simple duplication over premature abstraction.

## Quality bar

Before calling the graphics editor stable:

- `npm run build` succeeds for all workspaces
- tests pass
- demo works without host application dependencies
- no Saarnavideo API routes or project assumptions remain in the package
- document serialization is tested
- core geometry is tested
- pointer interactions are tested
- public package exports are intentional
- a consuming application can supply its own assets and persistence

## Current next step

Complete the atomic extraction:

1. `TransformProperties`
2. `TextProperties`
3. `ShapeProperties`
4. `ImageProperties`
5. `AnimationProperties`
6. `AssetPicker`
7. `CanvasLayer`
8. `SelectionOverlay`
9. `ResizeHandles`
10. `RotateHandle`

Then run a cleanup/test pass before adding new editor features.
