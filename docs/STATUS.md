# Repository status — audit, 2026-09-26

This is the first time the repository was installed, compiled, tested and run. The code had been written “passively”: pushed commit by commit without executing it.

## Summary

| Check | At audit | Now |
|---|---|---|
| `npm ci` | ✅ | ✅ |
| `npm run typecheck` (package + demo) | ❌ syntax errors, then ≈196 type errors | ✅ 0 errors |
| `vitest run` | ❌ 58 failed / 265 passed | ✅ 331 passed |
| Build | ❌ | ✅ |
| Demo: 3D workspace | ❌ blank page | ✅ works in a browser |
| Demo: 2D editor | ❌ blank page | ✅ works in a browser |
| Browser smoke tests (`npm run test:e2e -w @jsilvanus/graphics-editor-demo`) | — | ✅ run in CI |

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

### Step 3: the 2D editor (done)
The 2D editor crashed on load and, once it loaded, had no styling and several broken interactions. Fixed:
- **Crashes:** use-before-declare in `GraphicsEditor` (`selectedIds`, `viewport`) and `LayerList` (`isComposition`); `marquee` was never passed into the canvas.
- **No styling at all:** the editor's stylesheet was dropped in an old refactor. It is restored as `src/styles.ts` and updated for the current pan/zoom canvas. Handles keep a constant on-screen size (`--ge-zoom`).
- **Canvas viewport:**
  - The canvas now fits to the viewport on first render.
  - Zoom-at-cursor accounts for the rulers.
  - Wheel zoom uses a non-passive listener, so the page no longer scrolls.
  - Space/middle-drag panning wins over marquee selection.
- **Drag edits lost / no undo.** The host echoing `onChange` back as the `document` prop reset the editor and its history on every change. Now the editor ignores its own documents. Drags commit one history entry (`commitFrom`) instead of re-committing a stale snapshot.
- **Stale closures:** layer operations build on the latest document (`getDocument`). Previously two updates in one event overwrote each other, which is how text edits were lost.
- **Groups:** a full-viewport container inside every group swallowed clicks on empty canvas and dragged the group.
- **Drawing tools:**
  - Line and Star drags never recorded their end point.
  - Path, polygon and orthogonal couldn't be finished. They now finish on double-click or Enter.
- **Text:** double-click editing never started, because the frame captures the pointer. The frame now requests the edit.
- **Timeline:**
  - Seek did nothing (a command without an operation).
  - Playback restarted every frame and barely advanced.
  - The default timeline was recreated on every render with new ids.
  - Scene blocks were nested `<button>`s.
- **Files:** Import JSON and Open .wegra loaded the file and then immediately overwrote it with the old document.
- **Smaller fixes:**
  - The layer-list move called a non-existent `moveLayer`.
  - The path-offset control passed the layer id as the distance.
  - Font assets used `document.fonts` on the graphics document instead of the DOM.
  - Arrow-key nudge fired while typing in inputs.
  - Added Delete/Backspace and Ctrl/Cmd+D shortcuts.
- **Verified in Chromium:**
  - select, move, resize, rotate
  - property edits, undo/redo, keyboard nudge, delete, duplicate
  - marquee selection, group/ungroup
  - add text/rectangle/ellipse, draw a line
  - double-click text editing
  - timeline seek and play
  - wheel zoom and fit
  - JSON and .wegra round-trips
  - adding a 3D view
  - no console errors

Known gap: the file-input ids are global, which would break two editors on one page.

### Step 4: model reconciliation (done)
Guiding rule: where code and tests disagree, the code's intent wins.
- **Keyframes:**
  - `AnimationKeyframe<T>` / `AnimationTrack<T>` are the one keyframe model. `Track` (2D layers) and `Graphics3DTrack` are specialisations.
  - Keyframe helpers (`upsertKeyframe`, `moveKeyframe`, …) are generic over any track.
  - Easing lives in `interpolation.easing`. The scene and composition timelines wrote it elsewhere, so the easing picker had no effect. Old documents' bare `easing` is still read.
- **Declared types that code already used:**
  - `Viewport`; resolved outputs now carry their `viewport`.
  - `SceneTimeline.tracks3d` for 3D-view presentation tracks, with the `"view"` target.
  - `Layer.sourceIn`, and `Layer.scaleX/scaleY` (now also rendered).
  - `GraphicsOutput.duration`.
  - One shared `Vec3`, and `GroupChildSnapshot`.
  - `Scene.compositionId` and `Graphics3DView.renderAssetId` are now optional.
- **Bugs found through the type errors:**
  - Scene-timeline 3D keys were written to a stray `timeline.timeline`. `3d-timeline` now has track-list helpers used by both world and scene timelines.
  - An `add-keyframe` on a document without a timeline returned `undefined` as the document.
  - Constant-speed spatial interpolation passed the wrong bezier shape and produced NaN.
  - Nested compositions inside scenes were evaluated without a time.
  - Face inset flattened untouched faces into loose vertex ids, corrupting the mesh.
  - Edge split read half-edge faces as vertex arrays and always threw.
  - World-animation applied `"view"` tracks as light tracks.
  - Multi-selection resize handles passed arguments in the wrong order; resizing several layers together works now.
  - The path offset callback was never destructured.
  - Numeric `border-radius` rendered without a unit.
  - The 3D view inspector treated the boolean `loop` as a string.
- Removed the unused duplicate `history/historyStore.ts`.
- The scene timeline's `tracks3d` are stored, but not yet evaluated onto 3D views at render time. That is part of the 2D↔3D link, which is deferred for now.

### Step 5: tests green and browser smoke tests in CI (done)
Guiding rule: where code and tests disagree, the code's intent wins. Real bugs in the code were fixed rather than papered over.
- **Code bugs fixed:**
  - Polygon booleans never actually clipped: intersection nodes were spliced into the rings but never visited. This is rewritten as proper Greiner–Hormann (intersect, union, subtract; either orientation), with new union and subtract tests.
  - Bevel bands were wound backwards, so they were back-face culled. Winding is now tested.
  - The legacy `extrudeMeshFace` kept the base face and capped the top facing inwards.
  - The edge-loop walk only went in one direction across an edge shared by two quads.
  - Any world timeline track edit dropped the world's `duration` and `loop`.
  - `ungroup-layer` and `group-layers` were not exact inverses.
  - Undoing a style change left an empty `style: {}`.
  - Transition progress read 0 for an output that is fully on.
  - Video clips mapped media time as if `timeOffset` were a media offset. The composition timeline UI treats it as the clip start.
- **Tests corrected to the code's intent:**
  - Colours are `#rrggbbaa`.
  - World time wraps into `[inPoint, outPoint)` as the world-time doc specifies.
  - Negative scene time clamps to the start.
  - Inverse operations undo; several tests asserted the reverse.
  - Mesh counts that the geometry can't produce were fixed (split, connect, bevel, duplicate).
  - Viewport-override fixtures were keyed by composition instead of viewport.
  - Missing fixture fields were added.
- **Browser smoke tests:** `apps/demo/e2e` has Playwright tests that load both editors, check for console errors, and do a basic edit in each. CI runs them in an `e2e` job. The package CI job now typechecks every workspace.

**Needs a decision.** The mesh-edit functions are named against Blender's conventions:
- `selectEdgeLoop` walks across quads to the opposite edge. Blender calls that a ring.
- `selectEdgeRing` follows parallel edges that meet at a vertex. Blender calls that a loop.
The tests now document the current behaviour; swapping the names (and the toolbar labels) would be a small follow-up.

Also a choice to confirm: a scene resolved for an unknown viewport id still renders, without overrides, rather than returning nothing.

## Blocking problems that remain

### Test files out of date with the model
17 type errors remain, all in tests:
- Fixtures missing now-required fields (`Track.targetId`, `GraphicsOutput.background`, mesh `transform`).
- Tests reading `viewport` without an optional check.
- A few expectations that don't match the code. For example, the edge-split tests expect 4, 6 and 18 where the geometry gives 5, 8 and 12.

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
