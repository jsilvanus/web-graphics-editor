# Repository status — audit, 2026-09-26

This is the first time the repository was installed, compiled, tested and run. The code had been written “passively”: pushed commit by commit without executing it.

## Summary

| Check | At audit | Now |
|---|---|---|
| `npm ci` | ✅ | ✅ |
| `tsc --noEmit` (package) | ❌ syntax errors, then ≈196 type errors | ❌ 158 type errors, none in the 3D workspace |
| `vitest run` | ❌ 58 failed / 265 passed | ❌ 45 failed / 281 passed |
| Demo: 3D workspace | ❌ blank page | ✅ works in a browser (see below) |
| Demo: 2D editor | ❌ blank page | ⏳ next step |
| CI (test-pyramid) | ❌ | ❌ first floor still fails; the format job passes |

## Progress log

### Step 1–2: tooling and the 3D workspace (done)
- Added `@types/three` and prettier; reformatted the code.
- Wrote the missing `mesh/scale-vertices` (with tests), and defined the missing mesh-edit drag handler and `onExtract` wiring.
- Rewrote `ThreeDWorkspaceViewport`. The old version rebuilt the whole WebGL renderer on every React render, synced geometry only at mount, kept the mesh-edit mode in a ref (so the toolbar never updated), and rendered through the stored scene camera while resetting it on every change. Now:
  - The viewport has its own editor camera (orbit / pan / zoom).
  - Stored cameras are drawn as short camera gizmos. "Edit camera in viewport" moves the active one, and "Camera view" looks through it.
  - The scene is built once and synced on each change.
- Mesh-edit handles now follow the mesh's transform, and they are rebuilt after a gizmo drag. Face picking selects whole quads (both triangles of a box side). Orbit is paused while dragging an edit gizmo.
- Meshes are flat-shaded by default, with a new optional `material.smoothShading`.
- The demo has "2D editor" and "3D workspace" tabs (`?editor=3d`), each behind an error boundary.
- Verified in Chromium:
  - click-to-pick and deselect
  - translate gizmo
  - inspector edits
  - vertex, edge and face modes
  - face extrude, gizmo drag, and undo/redo
  - add/delete mesh, add light
  - camera view and camera editing
  - no console errors, and one WebGL canvas for the whole session

## Fixed during the audit

- Literal `\n` sequences written into source instead of newlines: `LayerList.tsx`, `CompositionTimelinePanel.tsx`.
- Broken JSX: a stray fragment in `CompositionTimelinePanel.tsx` and an unclosed `<label>` in `GradientProperties.tsx`.
- `OutputRenderer.tsx` declared `frame` twice (a rAF ref and the composed frame).
- `spatial-interpolation.ts` reassigned a `const` (`prev`).
- The demo resolves the package from source through a Vite alias and a TS path, so it no longer needs a built `dist/`.
- Added a `.gitignore`. There was none, so `node_modules` would have been committed.

## Blocking problems that remain

### Missing code: things referenced but never written
- The `Viewport` type (used by `types.ts`, `presentation.ts` and `index.ts`); `Vec3` export; `GroupChildSnapshot`.
- Undefined identifiers inside components: `marquee` (GraphicsEditorCanvas), `onOffset` (LayerProperties), `layerOps.moveLayer` (GraphicsEditor).

### Model drift: code and types disagree
- `SceneTimeline.tracks3d` is used by the timelines but not declared.
- `Layer.sourceIn` is used for video trimming but not declared.
- `Graphics3DView` and `Graphics3DAnimationTarget` shapes differ between tests, UI and types.
- `AnimationTrack` / `Keyframe` / `Track` are three overlapping keyframe types used interchangeably.

### Hook ordering bugs
- `GraphicsEditor.tsx` uses `selectedIds` and `viewport` before they are declared. Once the page loads, this will throw at runtime.
- `LayerList.tsx` uses `isComposition` before it is declared.

### Tooling
- The demo has never been type-checked in CI. CI only checks the package.

### Failing test groups
- Animation: colour interpolation returns `#rrggbbaa` where tests expect `#rrggbb`.
- Presentation / architecture / viewport-output: the viewport resolution shape changed. About 12 deep-equal failures.
- Mesh: edge split produces non-triangles, extrude/delete/bevel counts are off, and loop/ring selection is wrong.
- History and document operations: all `DocumentOperation` round-trips fail.
- World time looping, output controller/runtime transitions, and validation error messages.

## Code health notes

- The code was written minified (lines up to 9,000+ characters). It has been reformatted with prettier in one commit, and CI now checks formatting.
- Two dead `*.old` files remain in `components/`.
- The docs overlap (`3D-PLAN.md` vs `3d-feature-plan.md`, several WEGRA docs) and describe intent rather than reality. Treat this file as the source of truth for what works.

## Suggested path to a working editor

1. **Tooling baseline:** add `@types/three` and add prettier (formatting only) so the one-line files can be read.
2. **3D workspace boots:** write or restore `scale-vertices` and fix the mesh-edit controller's undefined callbacks. Then render `ThreeDWorkspace` alone and verify orbit, select, transform, and add box/camera/light in a browser.
3. **2D editor boots:** fix hook ordering, the missing identifiers and the missing exports. Verify drawing, selecting, moving and editing properties.
4. **Model reconciliation:** decide the single keyframe/track type, declare `tracks3d`, `sourceIn` and `Viewport`, and fix the type errors.
5. **Tests green:** fix the failing suites group by group. Add a Playwright smoke test for the demo (boots with no console errors) and run it in CI.
