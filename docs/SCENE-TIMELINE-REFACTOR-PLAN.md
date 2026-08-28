# Scene Timeline Refactor Plan

## Goal

Refactor the unified scene timeline into small, testable components before changing its 3D hierarchy. Preserve the current 2D timeline behavior while making the 3D timeline derive its tree from actual world contents rather than existing animation tracks.

## Target architecture

```text
SceneTimeline.tsx                 # final orchestrator; created/rebuilt last
├── SceneTimelineHeader.tsx       # playback, loop, duplication, current time
├── SceneTimelineRuler.tsx        # time ruler and coordinate conversion
├── SceneTimelineCanvas.tsx       # scene blocks + keyframe markers + playhead
├── SceneTimeline2DTree.tsx       # scenes, 2D objects, clips, 2D properties
├── ThreeDTimelineTree.tsx        # 3D views -> world objects/cameras
├── TimelineTrackRow.tsx          # reusable property/keyframe row
├── TimelineKeyframeEditor.tsx    # selected keyframe inspector
└── SceneTransitionControls.tsx   # scene transition editing
```

## Data-flow rules

1. `SceneTimeline` owns timeline state and mutation callbacks.
2. Presentational subcomponents do not mutate the document directly.
3. Track creation/keyframe creation remains in timeline-domain helpers.
4. The 2D tree continues to use scene/layer semantics.
5. A 3D canvas layer resolves its `Graphics3DView` and then its `worldId`.
6. The 3D tree enumerates every mesh and camera in that world, including entities with no animation tracks.
7. A property button on an unanimated entity creates the first track and keyframe at the playhead.
8. View-level opacity/visibility are distinct from nested world-object animation.
9. A 3D view remains a normal 2D canvas object; its nested tracks are additional timeline content.
10. One timeline and one playhead drive both 2D and 3D animation.

## Refactor sequence

### Step 1 — Extract stateless controls

- Header
- Ruler
- Keyframe editor
- Transition controls

No behavior changes.

### Step 2 — Extract 2D tree

Move scene/layer/clip/property rendering into `SceneTimeline2DTree`.

No behavior changes.

### Step 3 — Extract reusable track row

Centralize property label, keyframe count, marker rendering and add-track/add-key behavior.

Keep 2D and 3D track-domain operations separate.

### Step 4 — Replace 3D tree data source

`ThreeDTimelineTree` receives the actual 3D worlds/views and resolves:

```text
canvas layer -> Graphics3DView -> world -> meshes/cameras
```

It must not discover objects with:

```text
tracks3d -> target IDs
```

Unanimated entities must therefore appear immediately.

### Step 5 — Create the final `SceneTimeline.tsx`

Only after the subcomponents exist, rebuild `SceneTimeline.tsx` as an orchestration component. It owns:

- selected keyframe
- expanded tree state
- timeline mutation functions
- playhead conversion
- composition of the extracted components

The final file should contain minimal JSX and no large inline tree implementations.

### Step 6 — Integrate document 3D state

Pass the minimum required 3D document data from `GraphicsEditor` into `SceneTimeline` (prefer `worlds3d` and the existing view records rather than passing the entire editor state).

### Step 7 — Tests

Add focused tests for:

- unanimated mesh appears in timeline
- unanimated camera appears in timeline
- first keyframe creation
- view-level opacity/visibility remain independent
- two views of one world enumerate the same world objects
- 2D timeline behavior remains unchanged

## Non-goals

- No separate 3D timeline/playhead.
- No duplication of world state into views.
- No automatic creation of animation tracks merely because an object is displayed.
- No Blender-like full timeline editor.
- No MCP implementation.
