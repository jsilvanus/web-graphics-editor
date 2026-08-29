# WEGRA Animation Model

## 1. Two independent temporal levels

A WEGRA document has a main timeline. A reusable WEGRA3D World has its own World timeline. A 3D View maps WEGRA time into World time. World animation is evaluated in World time; view presentation is evaluated in WEGRA time.

## 2. Tracks and keyframes

An animation **track** represents one target property over time. A **keyframe** represents the value of that property at one time. Properties are independent by default.

Therefore position, rotation, opacity and material color can have keyframes at the same timestamp without becoming one inseparable animation. Editing one property does not modify the others.

A **KeyframeGroup** is optional editor metadata for deliberately selecting/moving/editing several property keyframes together. Grouping does not change evaluation semantics.

This follows the useful separation in Web Animations: keyframes describe property values, while timing/easing controls how values progress between them. citeturn0search1turn0search5

## 3. Interpolation versus transition

Do not use `SceneTransition` for property animation. Scene transitions are composition-level changes between scenes.

For animation, the segment from one keyframe to the next has an interpolation policy. The outgoing keyframe's interpolation/easing describes that segment.

Supported conceptual modes:

- `linear`: continuous interpolation.
- `discrete`: hold the previous value, then switch.
- `cubic-bezier`: progress follows a cubic-bezier easing curve.

The model stores easing parameters separately from the property value so the same temporal concept works for numeric, color and other animatable properties. Web Animations applies easing between keyframes, and Adobe distinguishes temporal interpolation from spatial interpolation. citeturn0search1turn0search30

## 4. Temporal versus spatial interpolation

For scalar properties such as opacity, FOV and rotation components, interpolation is temporal: calculate the value between two times.

For position, there can be a second dimension: **spatial interpolation**. A future spatial interpolation model may support a straight line or a curve/path through 2D/3D space. This is distinct from the temporal easing that controls how quickly the object travels along that path.

Thus a moving object can have:

- a straight spatial path + ease-in/ease-out speed;
- a curved spatial path + linear speed;
- a curved path + custom speed curve.

This distinction matches established animation tooling, where temporal interpolation and spatial interpolation are separate concepts. citeturn0search30turn0search11

## 5. Colors

Color is an animatable typed value, not a numeric-only keyframe. A color track can therefore contain:

`red @ 0s → black @ 2s`

The interpolation policy must specify the color interpolation space. The initial supported conceptual choices are sRGB, linear-sRGB, OKLab and OKLCH. CSS color interpolation now defaults to OKLab and allows the interpolation space to be specified; we should not silently assume that RGB-channel interpolation is always perceptually correct. citeturn0search3

## 6. Discrete properties

Boolean/enumerated properties such as visibility, projection type, render mode, and similar state switches should normally use `discrete` interpolation rather than numeric interpolation.

## 7. Current repository state

The repository currently has a numeric legacy `Keyframe` (`time + number + easing`) and property-specific tracks. The new typed animation model has been added alongside it so migration can be incremental rather than destabilizing the existing editor.

The current numeric evaluator should be migrated to use the same segment semantics: the interpolation/easing attached to the outgoing keyframe controls the interval until the next keyframe. This is the behavior used by Web Animations. citeturn0search1turn0search6

## 8. Example

A logo can independently animate:

- position: `(0,0,0) @ 0s → (200,0,0) @ 5s`
- material color: `red @ 0s → black @ 2s`
- rotation: `0° @ 0s → 360° @ 5s`

The color finishes at 2s while movement and rotation continue to 5s. If desired, keyframes at 0s and 5s can be grouped for editing, but the tracks remain independent during evaluation.

## 9. Future additions

The model should later add explicit spatial path data for position tracks, richer easing curves, spring/physics timing where justified, and property-specific interpolation strategies. These should be additions to the animation model rather than special cases in the renderer.
