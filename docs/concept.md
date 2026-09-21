# WEGRA Concept

**Status:** Conceptual direction

## 1. What WEGRA is

WEGRA is a **time-aware visual composition system**.

It combines:
- 2D graphics and vector geometry
- raster images
- video and other time-based media
- 3D worlds and views
- text and typography
- compositing and presentation
- animation and timelines
- live visual outputs
- rendering/export to video and other media

The central idea is not CAD, 3D, or video editing by itself.

> **WEGRA is a visual composition engine in which different kinds of visual objects can coexist, be transformed, composited, and evaluated over time.**

CAD and 3D are important capabilities, but they are part of the visual composition system rather than its defining purpose.

## 2. Primary use case

One important target is **live presentation and broadcast graphics**: lower thirds, speaker introductions, logos and bugs, animated titles, diagrams, presentation graphics, full-screen graphics, 3D model graphics, graphics over live video, and streaming overlays.

The same composition should be renderable as a webpage, image, or video.

Live output and offline rendering should use the same authoritative composition/evaluation model.

## 3. Not primarily a video editor

WEGRA may eventually provide substantial video-editing functionality, but video editing is not the foundational abstraction.

The foundational abstraction is:

> **A scene of visual objects evaluated at a particular time.**

A video is one kind of visual object. An image, path, text object, and 3D view are other kinds. They participate in the same composition and timeline.

Traditional video editing can emerge from this model without making an NLE the architectural center.

## 4. Time-aware visual objects

A composition may contain:

    Image
    Video
    Text
    Path
    Shape
    Group
    3D View

Objects have persistent properties and may expose those properties to animation: position, size, rotation, scale, opacity, visibility, color, geometry, text properties, material properties, camera properties, masks, and effect parameters.

The animation system is property-oriented rather than tied to particular object types.

## 5. Composition time

The main composition has a timeline. At time t, WEGRA evaluates the document and obtains the visual state that should be rendered.

    document
       |
       v
    composition time t
       |
       +-- evaluate 2D objects
       +-- evaluate media objects
       +-- evaluate 3D views
       +-- evaluate presentation state
       |
       v
    renderer

The timeline is therefore part of the semantics of a WEGRA composition, not merely an editor UI.

## 6. Video has its own time

Video is a visual object containing temporal media. It participates in composition time while also having an internal media time.

Conceptually:

    composition time = 35s
    video start      = 20s
    source offset    = 3s
    rate             = 1.0
    -> render source frame at 23s

A video object should support source media, in/out points, offset, playback rate, looping, pause/freeze, seeking, source-time mapping, and audio where supported.

The compositor should not have a separate video animation engine. It evaluates the video object's media-time mapping as part of evaluating the object at composition time.

## 7. Multiple time domains

WEGRA has a distinct 3D world-time concept. The complete system therefore contains several related but independent time domains.

    Output/runtime clock
            |
            v
    Main composition time
            |
            +-- 2D animation
            +-- video/media time mapping
            +-- 3D View
                    |
                    v
                World time
                    |
                    v
                World animation

Video and 3D world time mappings are conceptually analogous. A video may play at half speed or loop independently; a 3D world may spin continuously; two views may observe the same world at different world times.

## 8. 2D and 3D are peers

WEGRA 3D is not the foundation of the entire application.

A World3D represents what exists in a 3D space. A View3D places a view of that world into the ordinary 2D composition.

    World3D
       | camera / world-time mapping
       v
    View3D
       | ordinary composition object
       v
    2D composition
       +-- image
       +-- text
       +-- path
       +-- video
       +-- other objects

3D is therefore naturally usable as presentation content.

## 9. Image-to-3D and 3D-to-image workflows

2D imagery and 3D content should participate in the same visual transitions.

For example, a product graphic may begin as a flat image, transition through image + 3D, and become a 3D view whose camera and object animate.

A circle could visually become an obelisk by transitioning from a 2D representation into a 3D representation and changing the camera/object state. This should emerge from ordinary composition objects, geometry, camera state, visibility, masks, and animation rather than a special-purpose effect.

## 10. Compositing is fundamental

WEGRA is fundamentally a compositor. Objects are ordered and combined into a visual result.

    live camera/video
          + background
          + image
          + 3D graphics
          + shapes
          + text
          + lower third
          + logo bug
          = output

The result may be opaque or preserve transparency.

## 11. Live graphics

A WEGRA output can be used as a live graphics source. A host such as a broadcast or streaming application can consume the rendered output.

Outputs may be transparent or opaque, static or animated, user-controlled or externally live-controlled.

WEGRA should remain a generic graphics engine rather than encode a particular production application's domain model.

## 12. Timeline and animation

The timeline is a core WEGRA subsystem. Property tracks are independent.

    Lower third
    position  *--------------*
    opacity   *------*
    scale     *----------*
    text      JUHA-------------JUHA ITALEINO

3D models, videos, masks, materials, cameras, and ordinary 2D objects can all expose animatable properties.

Animation remains generic and property-oriented so new object types can use the same animation engine.

## 13. Nested compositions

A composition should eventually be usable as an object inside another composition.

    Main show
    |-- Camera feed
    |-- Logo
    |-- Lower Third
    `-- Product Introduction
        |-- image
        |-- 3D model
        |-- text
        `-- animation

Nested compositions need a defined relationship between parent time and child time, analogous to media and world-time mappings.

## 14. Presentation and outputs

A WEGRA document describes content. An output describes how that content is presented and run.

A project may contain compositions, assets, worlds3d, timelines, and multiple outputs such as Lower Third, Full Screen, Logo Bug, and Preview.

Outputs may share content while having different viewport settings, visibility, playback mode, clocks, transitions, and live runtime state.

## 15. Runtime versus document state

Persistent document state includes objects, geometry, compositions, animation definitions, worlds, assets, and outputs.

Runtime state includes current playback time, play/pause state, live on/off state, transition progress, and external control connections.

A TAKE operation changes runtime presentation state. It does not create or destroy document objects or mutate animation merely because a graphic went on air.

## 16. Rendering

The same authoritative evaluation pipeline should serve all rendering targets:

    WEGRA document
          |
    runtime / requested time
          |
    main timeline evaluation
          |
    media-time mappings
          |
    3D world-time mappings
          |
    2D + media + 3D composition
          |
       renderer
          |
      +---+---+
      |   |   |
    web live video

There should not be one animation engine for the editor and another for live output or video export.

## 17. Video editing as a consequence

Once WEGRA has compositions, time-aware objects, video objects, property animation, media-time mapping, compositing, and video rendering, it can naturally grow into a video editor.

That is desirable, but it is an extension of the visual composition model rather than the model itself.

## 18. CAD and geometry

WEGRA also contains substantial geometry/CAD capability. Editable 2D paths, Bézier curves, shapes, transforms, and 3D worlds provide another source of visual content.

    CAD / geometry
          |
    visual objects
          |
    composition
          |
    animation
          |
    presentation / rendering

Geometry can therefore be used directly as presentation content.

## 19. One object model, many uses

The same object should not need separate representations for editing, presentation, animation, live rendering, and offline rendering.

These are different consumers of the same authoritative document model.

## 20. Long-term direction

The goal is not a collection of loosely connected editors. It is one general-purpose visual composition engine with specialized editing surfaces.

Possible surfaces include:
- 2D editor
- image editor
- 3D editor
- timeline/motion editor
- presentation/output controller
- video editor

All should operate on the same underlying WEGRA document and evaluation model.

The document is the center. The timeline is part of the document's behavior. The renderer consumes evaluated document state. Live presentation is one output mode. Video is one visual object type and one possible output medium. 3D is one visual domain. CAD is one source of editable geometry.

**The unifying concept is time-aware visual composition.**