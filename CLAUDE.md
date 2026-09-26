# CLAUDE.md

Guidance for Claude (and other agents) working in this repository.

## What this is

`web-graphics-editor` is an npm-workspaces monorepo for a reusable React graphics editor (“WEGRA”).

- `packages/graphics-editor` — `@jsilvanus/graphics-editor`: document model, 2D editor (`GraphicsEditor`), 3D workspace (`ThreeDWorkspace`, Three.js), timelines, outputs, WEGRA (de)serialization.
- `apps/demo` — Vite + React 19 demo app that mounts the 2D editor and the 3D workspace side by side.
- `docs/` — design documents. Start with `docs/STATUS.md` (current real state), then `docs/PLAN.md`, `docs/WEGRA-CONCEPTUAL-MODEL.md`, `docs/3D-PLAN.md`.

The 2D editor and the 3D workspace are separate components. The 3D world can be embedded into 2D compositions via 3D views, but that link is not a current goal — get each editor working on its own first.

## Current state — read before changing anything

Until September 2026 the code was written without ever being run, compiled or tested. See `docs/STATUS.md` for the audit. In short:

- `npm run typecheck` fails (≈200 errors), `npm test` fails (≈58/323 tests), and the demo does not boot.
- Many errors are API drift: callers use names, props or modules that do not exist (e.g. `mesh/scale-vertices`, `interpolateKeyframes`, `Viewport`, `tracks3d`, `sourceIn`).
- Do not trust that a feature works because code for it exists. Verify by running it.

## Commands

Run from the repo root (Node ≥ 20; ESM everywhere):

```bash
npm ci                    # install
npm run dev               # demo at http://localhost:5173 (resolves the package from src, no build needed)
npm test                  # vitest, packages/graphics-editor
npm run typecheck         # tsc --noEmit, all workspaces
npm run build             # tsc build of the package
```

Package-only: `npm exec -w @jsilvanus/graphics-editor vitest run src/some.test.ts`.

The demo's `vite.config.ts` and `tsconfig.json` alias `@jsilvanus/graphics-editor` to `packages/graphics-editor/src/index.ts`, so no `dist/` is needed during development.

### Checking the app in a browser

Chromium is available for Playwright in the cloud environment (`/opt/pw-browsers`). To verify UI changes: start `npm run dev`, load the page with Playwright, collect `console` errors and `pageerror` events, and take a screenshot. A change is not done until the page renders without runtime errors.

## Definition of done for a change

1. `npm run typecheck` does not get worse (goal: zero errors).
2. Tests touched by the change pass; no new failing tests.
3. If UI is touched, the demo loads and the feature works in a real browser.
4. New test files are added to `packages/graphics-editor/test-manifest.json` (CI fails otherwise).

## Code conventions

- TypeScript, strict mode, ESM, React 19 function components and hooks.
- **Write readable, formatted code.** Much of the existing code is minified onto single lines of 1–10k characters. Do not add more of it. When you substantially edit such a line, reformat it into normal multi-line code.
- **Never write literal `\n` escape sequences in place of newlines.** Several files were broken this way. Check the diff before committing.
- Keep the document model independent from React. Editing goes through document commands and history operations (`src/document/`, `src/history/`), not ad-hoc state mutation.
- The package must not depend on Next.js, a backend, or host-specific URLs. Hosts supply assets and persistence through props and callbacks.
- Three.js is the 3D renderer. Import from `three` and `three/examples/jsm/...`.
- Before importing or calling something, check that it exists. A lot of the breakage came from calling helpers that were never written.

## Layout of `packages/graphics-editor/src`

- `types.ts` — the document model (layers, compositions, scenes, worlds3d, views3d, outputs).
- `GraphicsEditor.tsx` — the 2D editor root. Hooks are in `hooks/`, UI is in `components/`, and canvas rendering is in `components/canvas/`.
- `ThreeDWorkspace.tsx` — the 3D editor root. It uses `components/ThreeDWorkspaceViewport.tsx`, `ThreeDWorkspaceInspector.tsx`, `components/mesh-edit/`, and `3d-*.ts`.
- `mesh/` — half-edge and triangle mesh topology operations (extrude, bevel, inset, split, weld, …).
- `document/`, `history/` — commands and undo/redo operations.
- `animation.ts`, `timeline.ts`, `world-*.ts`, `time.ts` — animation and time mapping.
- `wegra.ts`, `serialization.ts`, `projectFormat.ts`, `svg.ts` — file formats.
- `outputs*.ts`, `output-*.ts`, `OutputRenderer.tsx` — output and playout runtime.
- `*.old` files are dead leftovers. They are not compiled.

## CI

`.github/workflows/test-pyramid.yml` runs vitest suites in floors (unit → model → integration → package) from `test-manifest.json`. It then runs typecheck, all tests and the build. It currently fails at the first floor.
