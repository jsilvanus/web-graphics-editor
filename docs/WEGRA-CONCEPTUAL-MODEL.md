# WEGRA conceptual model

## Status

This document defines the current conceptual model of WEGRA. It is the architectural reference for the document model, editor, animation engine, renderer, and future serialization work.

## Core idea

WEGRA has two related but distinct spatial/temporal domains:

- **World3D** is an independently existing 3D world. It owns its 3D objects and its own timeline. A world may be animated and may loop.
- **Composition** is an ordered 2D layer structure. It contains/references WEGRA objects, including ordinary 2D objects and 3D Views. A composition is spatial; it is not itself a timeline.

The two domains are made temporal in different places:

```text
World3D ──→ World Timeline ──→ View

Composition ──→ Scene / Main Timeline ──→ Viewport
```

A **View3D** is a WEGRA object that provides a viewpoint into a World3D. The same World3D may therefore be observed through multiple Views, potentially with different cameras and world-time mappings.

A **Scene** temporalizes a Composition on the main timeline. A scene has a temporal extent and may contain keyframes even when its visual state does not change. The main timeline animates 2D objects/layers and 3D Views; it does not own the internal animation of a World3D.

A **Viewport** is a presentation context for a composition. It defines the target coordinate/presentation context and can provide per-layer presentation overrides such as position, size, visibility, and other presentation properties. A viewport does not duplicate the composition or its objects.

An **Output** is an independently renderable presentation endpoint. Outputs may be active concurrently. WEGRA does not assume that one output represents an entire broadcast/program. An output exposes a viewport (or presentation selection) through a renderer and has runtime behavior such as playback, background mode, live control, and transitions.

## Conceptual hierarchy

```text
WEGRA DOCUMENT
│
├── metadata / provenance / assets
│
├── Objects
│   ├── text
│   ├── image
│   ├── rectangle / ellipse / line / path
│   ├── groups
│   └── View3D
│
├── Layers
│   └── ordered compositing units containing/referencing objects
│
├── Compositions
│   └── ordered layer structures / reusable visual arrangements
│
├── Scenes
│   └── temporal instances/evolutions of compositions
│
├── Main Timeline
│   ├── scene timing
│   ├── 2D layer/object animation
│   └── View3D animation
│
├── Worlds3D
│   └── each world owns:
│       ├── meshes / 3D objects
│       ├── materials
│       ├── lights
│       ├── cameras
│       └── World Timeline
│
├── Viewports
│   └── presentation contexts with viewport-specific overrides
│
└── Outputs
    └── independently controllable render endpoints
        └── Output Runtime (ephemeral state)
```

## Layers and objects

Layers are first-class. They are not synonymous with objects.

An object is a graphical entity. A layer is the compositing/organizational unit that gives objects an ordered place in a composition and carries presentation properties such as visibility, opacity, transform, animation, and viewport overrides.

A typical composition is therefore:

```text
Composition: Speaker Introduction
│
├── Layer: Background
│   └── Rectangle
├── Layer: 3D
│   └── View3D
├── Layer: Name
│   └── Text
└── Layer: Logo
    └── Image
```

The layer order defines compositing order.

## World3D and View3D

World3D is independent of any particular 2D composition. Its timeline controls the evolution of objects inside that world.

```text
World3D: Spinning Logo
│
├── Mesh
├── Material
├── Camera
├── Lights
└── World Timeline
    └── rotation / material / object animation
```

A View3D references a World3D and a camera and is itself a normal WEGRA object in the 2D composition/layer system.

```text
Main Timeline
    │
    ▼
  View3D ─────────→ World3D
    │                  │
    │                  └── World Timeline
    │
    └── 2D placement/animation
```

A View3D may map its local/main-timeline time to world time. This permits the same animated world to appear in multiple views with different cameras or world-time mappings.

## Composition and Scene

A Composition describes **what is spatially composed**. It is an ordered arrangement of layers/objects.

A Scene describes **how that composition exists over time**.

```text
Composition
    │
    │ temporalization
    ▼
Scene
    │
    ▼
Main Timeline
```

A scene has a start and duration. The temporal representation may have keyframes at the beginning and end even if their values are identical. The absence of a visual change does not remove the scene's temporal meaning.

Animation remains property-independent: separate properties such as position, opacity, color, and scale may have independent tracks/keyframes. A simultaneous edit can therefore produce keyframes on the properties actually changed rather than forcing unrelated properties into one keyframe.

## Viewport

A viewport answers:

> How should this composition be presented for this target context?

A viewport is not another composition and does not copy objects.

A layer may have default geometry/presentation and viewport-specific overrides:

```text
Layer
├── default x/y/width/height/...
└── viewport overrides
    ├── broadcast
    │   ├── position / size
    │   └── visibility
    └── venue
        ├── position / size
        └── visibility
```

This supports cases such as:

- a lower third appearing in a broadcast viewport but not on a venue projector;
- lyrics appearing on venue displays but not in the broadcast;
- the same graphic occupying different positions on landscape and portrait targets.

The viewport is therefore a presentation coordinate/context layer, not a content container.

## Output

An Output is an independently renderable and controllable endpoint. It is deliberately generic and must not encode LCYT-specific concepts such as DSK, program, preview, or broadcast switcher state.

Multiple outputs may be active simultaneously:

```text
Composition / presentation
       │
       ├── Broadcast viewport ──→ Output A
       ├── Venue viewport ──────→ Output B
       └── Portrait viewport ───→ Output C
```

An output may be transparent or opaque, static/automatic/user/live, and may define in/out transitions. These are output/presentation concerns, not properties of the underlying composition content.

The host application (for example a broadcast application) decides how multiple WEGRA outputs are consumed and composited. WEGRA remains a reusable graphics engine.

## Output Runtime

Output Runtime is ephemeral state rather than document content:

```text
Output
├── persistent configuration
│
└── Output Runtime
    ├── off / entering / on / exiting
    ├── current playback time
    ├── playing/paused
    └── transition progress
```

Commands such as TAKE, TAKE_OFF, PLAY, PAUSE, SEEK, and RESET operate on runtime state. The transport used to deliver these commands (WebSocket, HTTP, host API, etc.) is outside the WEGRA core model.

## Two analogous transformations

The model deliberately contains two analogous spatial/presentation transformations:

```text
3D DOMAIN                         2D DOMAIN

World3D                           Composition
   │                                  │
   │ viewpoint                        │ presentation context
   ▼                                  ▼
View3D                            Viewport
   │                                  │
   ▼                                  ▼
rendered 3D content              rendered composition
```

And two independent temporal domains:

```text
World3D ──→ World Timeline

Composition ──→ Scene ──→ Main Timeline
```

These timelines must not be conflated. A World3D can continue its own animation while the WEGRA main timeline moves a View3D through scenes, and multiple Views can map into the same World3D at different world times.

## LCYT relationship

The LCYT DSK editor is a design reference for viewport behavior, especially its per-layer viewport geometry overrides. WEGRA does not import LCYT's domain model. LCYT may map its own concepts onto WEGRA's generic Composition, Layer, Viewport, and Output abstractions.

## Architectural invariants

1. **World3D is independently time-dependent.**
2. **View3D is an ordinary WEGRA object that observes a World3D.**
3. **Composition is spatial/layered, not temporal.**
4. **Layer is a first-class compositing unit.**
5. **Scene temporalizes a Composition on the main timeline.**
6. **Main Timeline controls 2D/layer animation and View3D presentation; World Timeline controls the contents of a World3D.**
7. **Viewport changes presentation for a target context without duplicating content.**
8. **Visibility may differ by viewport.**
9. **Outputs are independent and may be active concurrently.**
10. **Output/runtime/transport semantics must remain generic and must not encode LCYT-specific concepts.**
11. **Persistent document state and ephemeral runtime state remain separate.**
12. **Provenance belongs to serialized WEGRA resources and relationships as appropriate.**
