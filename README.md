# Web Graphics Editor

A reusable React-based graphics editor for structured visual content workflows.

The project is built around a serializable graphics document rather than a canvas-only editing model. It supports 2D compositions, timelines, SVG import/export, 3D worlds and meshes, animation, and multiple output views. The architecture is designed so the same document can be edited by a human UI, rendered by different hosts, or eventually manipulated by AI tooling.

## Repository structure

- `packages/graphics-editor` — reusable `@jsilvanus/graphics-editor` package
- `apps/demo` — small Vite demo application
- `docs/` — architecture and design documents

## Current capabilities

### 2D graphics

- Layer-based graphics documents
- Shapes, lines, paths, text, images, groups and custom content
- Transforms, styling, alignment and distribution
- Selection, snapping and canvas editing
- SVG import/export
- Project serialization and asset references

### Time and composition

- Compositions with their own dimensions and timelines
- Scenes, clips, tracks and keyframes
- Property interpolation and easing
- Playback, seeking and timeline editing
- Viewports that select how compositions/worlds are displayed

### 3D

- Structured 3D worlds containing cameras, lights and meshes
- Editable mesh topology and geometry operations
- Materials and transforms
- Three.js-based 3D rendering
- 3D animation data and world-time mapping
- Dedicated 3D workspace and inspector

The 3D system is under active development. In particular, the modelling UX and complete animated-3D rendering pipeline are not yet considered finished.

### Outputs

Graphics documents can define named outputs independently from the worlds and compositions they display. Output runtime primitives support operations such as play, pause, seek, reset and take/take-off style control.

External production-control transports and integrations are intentionally not part of the current editor package.

## Architecture

The core model separates the major concepts:

```text
Project / Document
│
├── Assets
├── Compositions ── Timelines ── Keyframes
├── Worlds ──────── 3D objects / cameras / lights
├── Viewports ───── choose what is displayed
└── Outputs ─────── define presentation/control targets
```

A **world** has its own time. A **composition** organizes visual content and timing. A **viewport** chooses what the viewer sees. An **output** describes how that view is presented.

Editor packages expose React components and serializable document models. Host applications provide persistence, APIs, authentication, and application-specific assets.

The editor package should not depend on Next.js or a backend API. This keeps it reusable from Vite/React applications as well as Next.js applications such as Saarnavideo.

## AI / MCP

The document model is intentionally structured so that AI tooling can operate on projects without redesigning the editor. MCP integration is **not implemented yet**.

The intended direction is for AI operations to use the same document/command and history mechanisms as the human editor rather than manipulating React state directly.

## Development

```bash
npm install
npm run dev
```

Run the package tests with:

```bash
npm test
```

## Design principles

1. Keep editor state and document formats reusable.
2. Keep application/backend concerns out of editor packages.
3. Prefer small focused packages over one large editor framework.
4. Keep the document model independent from the React UI.
5. Keep document serialization stable for persistence and future interoperability.
6. Treat worlds, compositions, viewports and outputs as distinct concepts.
7. Make the editor suitable for both human interaction and future programmatic/AI control.
8. Keep rendering implementations replaceable where practical.

## Status

The 2D editor and core document model are substantially implemented. Timeline support, 3D data structures/rendering, and output runtime primitives are also present, while several higher-level workflows remain under active development.

The current development priorities are:

1. Complete and harden 3D bevel/topology operations.
2. Improve the 3D editing UX.
3. Complete the animated 3D render/cache pipeline.
4. Continue strengthening project-format and editor invariants.
5. Add the planned AI/MCP integration.
