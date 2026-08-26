# Web Editors

Reusable React-based web editors for visual content workflows.

## Repository structure

- `packages/graphics-editor` — reusable `@jsilvanus/graphics-editor` package
- `apps/demo` — small Vite demo application

The monorepo is intentionally ready for additional editors, for example `video-timeline-editor`, `audio-editor`, or `scene-editor`.

## Architecture

Editor packages expose React components and serializable document models. Host applications provide persistence, APIs, authentication, and application-specific assets.

The editor packages should not depend on Next.js or a backend API. This keeps them reusable from Vite/React applications as well as Next.js applications such as Saarnavideo.

## Development

```bash
npm install
npm run dev
```

## Principles

1. Keep editor state and document formats reusable.
2. Keep application/backend concerns out of editor packages.
3. Prefer small focused packages over one large editor framework.
4. Keep the first renderer DOM/CSS based; introduce canvas/WebGL only when required.
5. Keep document serialization stable for persistence and future interoperability.
