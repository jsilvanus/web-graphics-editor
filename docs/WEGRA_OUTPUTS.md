# WEGRA Live Outputs

**Status:** Draft v0.1

## 1. Purpose

A WEGRA project is not only an editable composition. It may also expose one or more **outputs**: renderable presentations of the project that can be displayed in a normal webpage, embedded in another page, or used as a live transparent graphics source for broadcast systems such as LCYT.

An output is a presentation/runtime configuration over the same authoritative WEGRA document. It is not a second composition and must not duplicate document or timeline state.

The same output definition can therefore be:

- edited in the WEGRA editor
- displayed as a normal webpage
- embedded in another webpage
- rendered with transparency
- rendered with an opaque background
- run automatically
- held statically
- controlled by the viewer
- controlled remotely as a live production source

## 2. Core model

```text
WEGRA Document
│
├── Composition
├── Main Timeline
├── Worlds3D
├── Assets
│
└── Outputs
    ├── Lower Third
    ├── Full Screen
    └── Logo Bug
```

An `Output` identifies **what is presented and how it runs**, while the document identifies **what exists**.

Conceptually:

```ts
interface Output {
  id: string;
  name: string;

  composition: OutputComposition;
  presentation: OutputPresentation;
  playback: OutputPlayback;
  live: OutputLiveControl;
}
```

The exact TypeScript representation is intentionally deferred until the model is implemented.

## 3. Output composition

An output selects a composition/root presentation from the WEGRA document.

It may select:

- the complete composition
- a scene
- a composition region
- a named output composition
- selected layers/views

The output must reference existing document resources rather than copying them.

Example:

```json
{
  "id": "output-lower-third",
  "name": "Lower Third",
  "composition": {
    "type": "layers",
    "layers": ["speaker-name", "speaker-title", "logo"]
  }
}
```

A future implementation may introduce named composition groups, but this is not required for v0.1.

## 4. Presentation mode

Output presentation has an independent choice of background behavior.

### Transparent

```text
backgroundMode: "transparent"
```

The renderer preserves alpha. This is intended for overlays, browser sources, DSK systems and other compositing environments.

### Opaque

```text
backgroundMode: "opaque"
background: "#000000"
```

The renderer produces a normal self-contained visual presentation suitable for a webpage, fullscreen display or video capture.

Transparency is a presentation property. It does not change the underlying composition.

## 5. Playback mode

Playback is independent from presentation transparency.

Every output chooses exactly one primary playback mode:

```text
static
      Render a fixed state.

automatic
      Play according to the configured playback policy.

user
      Let the viewer control playback.

live
      Playback is controlled by an external live controller.
```

### Static

The output does not advance its clock automatically.

It may represent:

- a fixed timeline time
- the current selected time
- a configured frame

A static output is useful for still graphics and editable web embeds where animation is undesirable.

### Automatic

The output owns a playback clock and advances without user interaction.

Configuration may include:

```json
{
  "mode": "automatic",
  "start": "start",
  "loop": false
}
```

Automatic playback must be deterministic with respect to the output clock.

### User-playable

The output exposes playback controls to the viewer.

At minimum:

- play
- pause
- seek
- restart

Whether controls are visible is itself a presentation/UI option.

### Live

The output is controlled by a producer/controller rather than by the webpage viewer.

It supports commands such as:

```text
play
pause
seek
restart
TAKE
TAKE OFF
```

Live control is intentionally separate from ordinary user playback.

## 6. Live state machine

A live output may have an on-air state independent of the main timeline.

```text
OFF
 │
 │ TAKE
 ▼
ENTERING
 │
 │ in-transition complete
 ▼
ON
 │
 │ TAKE OFF
 ▼
EXITING
 │
 │ out-transition complete
 ▼
OFF
```

The output's composition remains persistent throughout these state changes. `TAKE` does not create or destroy document objects.

## 7. Transitions

An output may define independent transitions for entering and leaving the live state.

```json
{
  "in": {
    "type": "slide-left",
    "duration": 0.4
  },
  "out": {
    "type": "fade",
    "duration": 0.3
  }
}
```

Transitions are runtime presentation behavior.

They must not mutate the document's underlying animation keyframes merely because an output was taken on or off air.

Supported transition types may initially include:

- cut
- fade
- dissolve
- slide
- wipe

The transition system should reuse the existing interpolation/easing infrastructure where appropriate.

## 8. Persistent outputs

An output is a persistent document resource.

Saving a WEGRA project therefore preserves:

- output ID
- output name
- composition selection
- presentation settings
- playback mode
- playback defaults
- transition definitions
- live-control configuration that is safe to serialize

Runtime state is generally not source-of-truth document state.

For example, whether a live output happens to be `ON` at the moment a project is saved should normally not become permanent document state.

## 9. Editable outputs

Outputs remain linked to the authoritative WEGRA document.

Editing the underlying composition changes the output immediately on the next render.

```text
Editor edit
    ↓
WEGRA document
    ↓
Output renderer
    ↓
embedded/live presentation
```

There is no exported-copy editing model for a normal output.

An output can optionally be duplicated as a new output definition if independent presentation settings are desired.

## 10. Output clock

Every non-static output has an output clock.

The output clock determines main-timeline time for the rendered composition.

```text
output clock
     ↓
main timeline time
     ↓
view world-time mapping
     ↓
world timeline time
     ↓
rendered frame
```

This preserves the established distinction between:

- main WEGRA timeline time
- per-view world time
- World Timeline animation time

A world continues to be reusable and animated independently of the output that currently presents it.

## 11. Live TAKE semantics

`TAKE` changes the output's runtime presentation state.

It does not alter the main timeline.

Example:

```text
main timeline:      ────────────────────────────────
                     composition definition

live output:        OFF → ENTERING → ON
                              ↑
                             TAKE
```

The output may either:

1. continue its clock while OFF, or
2. use a configured clock policy such as `pause`, `reset`, or `continue`.

This policy must be explicit because a reusable animated graphic such as a spinning logo may need to continue while off air, while a lower third may normally restart when taken.

## 12. TAKE OFF semantics

`TAKE OFF` starts the configured out-transition.

The output remains rendered during `EXITING` so the transition can complete.

After completion it becomes `OFF`.

The composition itself remains available and editable.

## 13. Interrupting transitions

The runtime must define deterministic behavior when commands arrive during a transition.

Initial recommended policy:

```text
ENTERING + TAKE OFF → reverse/transition to OFF
EXITING  + TAKE     → reverse/transition to ON
```

The implementation may represent this internally as a transition with a normalized progress value rather than creating new timeline keyframes.

## 14. Static, automatic and user playback versus live TAKE

Playback mode and on-air state are separate concepts.

For example:

```text
playbackMode = automatic
liveState    = ON
```

means the output automatically advances while on air.

A live output may instead be:

```text
playbackMode = static
liveState    = ON
```

which produces a persistent still graphic that can nevertheless be taken on/off with transitions.

A user-playable output can be visible without being a broadcast/live output.

## 15. Web presentation forms

An output can be exposed through multiple presentation forms without changing its definition.

### Standalone output page

Conceptually:

```text
/render/<project>/<output>
```

This page contains the renderer but no editor UI.

It is suitable for:

- direct browser display
- fullscreen display
- browser capture
- broadcast browser sources

### Embedded output

Conceptually:

```html
<iframe src="/render/project/output"></iframe>
```

Embedding is a presentation mechanism, not a new output type.

A future embed API may permit controlled resizing, origin restrictions and postMessage playback commands.

### Transparent browser source

The same output may be requested with transparent presentation, conceptually:

```text
/render/<project>/<output>?background=transparent
```

The output renderer must contain no editor controls or editor chrome in this mode.

## 16. External live controller

A live output may expose a control channel separate from its render URL.

Conceptually:

```text
LCYT / production controller
          │
          │ TAKE / TAKE OFF / play / seek
          ▼
     WEGRA live runtime
          │
          ▼
     output renderer
```

The transport is intentionally unspecified in v0.1. WebSocket, HTTP control endpoints and other mechanisms can be evaluated when the runtime API is implemented.

The render endpoint must remain usable without the live-control channel.

## 17. Multiple outputs

A project may expose multiple outputs simultaneously.

Example:

```text
WEGRA
│
├── Output: Full Screen
├── Output: Lower Third
├── Output: Logo Bug
└── Output: Website Preview
```

Each output has its own:

- presentation mode
- playback mode
- output clock
- runtime state
- transitions

They may all reference the same underlying layers and worlds.

## 18. Shared animated worlds

Outputs do not own worlds.

If two outputs reference views of the same world, each view retains its own world-time mapping.

Therefore:

```text
                 World: spinning-logo
                       │
              ┌────────┴────────┐
              ▼                 ▼
          View A              View B
        world time 2s       world time 8s
              │                 │
              ▼                 ▼
         Output A            Output B
```

This is a core reason that world time must remain distinct from the main output clock.

## 19. Editing while live

A live output is still backed by the editable WEGRA document.

Edits should affect subsequent rendered frames according to normal document-edit semantics.

The runtime must not write temporary playback state into the document merely because an output is live.

For safe production operation, a future implementation may provide:

- preview/edit state
- committed/live state
- atomic output updates

Those are runtime/deployment concerns and are not required for the initial output model.

## 20. Security and sharing

Output URLs may expose project content without exposing the editor.

The eventual runtime should distinguish:

- editable project access
- render-only access
- live-control access

A render URL must not implicitly grant document editing or live-control permissions.

Authentication and authorization policy are implementation concerns, but the model must keep these capabilities separate.

## 21. Serialization

Outputs belong in the `.wegra` document/package.

Conceptually:

```text
project.wegra
│
├── document.json
├── timelines/
├── objects/
├── worlds3d/
├── assets/
├── outputs/
│   ├── lower-third.json
│   ├── logo-bug.json
│   └── full-screen.json
├── history/
└── provenance/
```

The output definition is declarative. Runtime state such as the current animation clock, transition progress and WebSocket connections is not serialized as authoritative document state.

## 22. Provenance and history

Creating, editing or deleting an output is a normal WEGRA document operation and belongs in WEGRA history.

Runtime events such as:

```text
TAKE
TAKE OFF
play
pause
seek
```

are runtime events, not necessarily document mutations.

If production provenance later requires them to be recorded, they should be recorded as output/runtime events without confusing them with document-edit history.

## 23. Renderer invariant

All output forms use the same authoritative evaluation pipeline:

```text
WEGRA document
      ↓
output runtime
      ↓
main timeline evaluator
      ↓
3D view world-time mapping
      ↓
World Timeline evaluator
      ↓
2D/3D renderer
      ↓
output page / embed / live source
```

The output system must not introduce a second animation engine.

## 24. Core invariant

> **An Output is a persistent, editable presentation/runtime configuration of a WEGRA composition. It may be rendered standalone or embedded, transparent or opaque, static or playable, automatic or externally live-controlled. Live TAKE/TAKE OFF changes presentation state, not document structure.**

This makes WEGRA suitable both as an ordinary graphics editor and as a live browser-rendered graphics source for production systems such as LCYT.