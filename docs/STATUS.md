# Repository status — audit, 2026-09-26

This is the first time the repository was installed, compiled, tested and run. The code had been written “passively”: pushed commit by commit without executing it.

## Summary

| Check | Result |
|---|---|
| `npm ci` | ✅ installs (Node 22, npm 10) |
| `tsc --noEmit` (package) | ❌ originally stopped at **syntax errors**; after the parse fixes, **≈196 type errors** |
| `vitest run` | ❌ **58 failed / 265 passed** (26 of 65 files failing) |
| Demo (`npm run dev`) | ❌ blank page: a dev-server 500 from a missing module |
| CI (test-pyramid) | ❌ would fail on the first floor |

## Fixed during the audit

- Literal `\n` sequences written into source instead of newlines: `LayerList.tsx`, `CompositionTimelinePanel.tsx`.
- Broken JSX: a stray fragment in `CompositionTimelinePanel.tsx` and an unclosed `<label>` in `GradientProperties.tsx`.
- `OutputRenderer.tsx` declared `frame` twice (a rAF ref and the composed frame).
- `spatial-interpolation.ts` reassigned a `const` (`prev`).
- The demo resolves the package from source through a Vite alias and a TS path, so it no longer needs a built `dist/`.
- Added a `.gitignore`. There was none, so `node_modules` would have been committed.

## Blocking problems that remain

### Missing code: things referenced but never written
- `mesh/scale-vertices` module, imported by `components/mesh-edit/controller.ts`. **This blocks the demo from loading.**
- `interpolateKeyframes`, `evaluateTrack` (from `timeline` / `animation`); `interpolate3DKeyframes`, `create3DTrack` (from `3d-animation`).
- The `Viewport` type (used by `types.ts`, `presentation.ts` and `index.ts`); `Vec3` export; `GroupChildSnapshot`.
- `CanvasSelectionOverlay` (the component is named `SelectionOverlay`).
- Undefined identifiers inside components: `marquee` (GraphicsEditorCanvas), `onExtract` (ThreeDMeshEditOverlay), `onTransformDraggingChanged` (mesh-edit controller), `onOffset` (LayerProperties), `layerOps.moveLayer` (GraphicsEditor).

### Model drift: code and types disagree
- `SceneTimeline.tracks3d` is used by the timelines but not declared.
- `Layer.sourceIn` is used for video trimming but not declared.
- `Graphics3DView` and `Graphics3DAnimationTarget` shapes differ between tests, UI and types.
- `AnimationTrack` / `Keyframe` / `Track` are three overlapping keyframe types used interchangeably.

### Hook ordering bugs
- `GraphicsEditor.tsx` uses `selectedIds` and `viewport` before they are declared. Once the page loads, this will throw at runtime.
- `LayerList.tsx` uses `isComposition` before it is declared.

### Tooling
- `@types/three` is not installed, so all Three.js code is implicitly `any` (18 errors). This also hides real 3D API misuse.
- The demo has never been type-checked in CI. CI only checks the package.

### Failing test groups
- Animation: missing exports (see above), and colour interpolation returns `#rrggbbaa` where tests expect `#rrggbb`.
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
