# WEGRA World Time Model

**Status:** Formalized

## Core invariant

A WEGRA3D **World is an independently time-dependent asset**. It is not a static space.

A `Graphics3DView` is a window into a World. The WEGRA main timeline controls the window; the World timeline controls the contents of the World.

The same World may be referenced by multiple WEGRA documents.

## Two timelines

### Main WEGRA timeline

Controls composition-level behavior, including:

- 3D view position and size
- view rotation and opacity
- view visibility
- when a view appears/disappears
- other presentation behavior

### World timeline

Controls intrinsic behavior of the reusable world, including:

- mesh transforms
- camera transforms
- camera properties such as FOV
- future world-local animation properties

World animation is serialized with the World and travels with it when the World is exported as `.wegra3d`.

## Time mapping

A view has a `worldTime` mapping:

```ts
interface WorldTimeMapping {
  offset: number;
  rate: number;
  loop?: boolean;
  inPoint?: number;
  outPoint?: number;
}
```

For a WEGRA time `t`, the initial world-time mapping is:

```text
worldTime = offset + t * rate
```

If `inPoint` is present, it is the lower bound of the usable world-time range. If `outPoint` is present, it is the upper bound.

When `loop` is enabled and a finite `[inPoint, outPoint]` range exists, time wraps within that range. A later implementation may define the exact behavior for open-ended ranges; until then, serialization should prefer finite loop ranges.

`rate = 1` means normal speed. `rate = 2` means the world runs twice as fast. `rate = 0` freezes the world. Negative rates are allowed by the type so reverse playback can be supported, but UI support can be added later.

## Independence

The World timeline does not use the WEGRA timeline's current time directly. A renderer evaluates a view in two stages:

```text
WEGRA time
    │
    ├── evaluate main timeline → View state
    │
    └── apply View.worldTime → World time
                                  │
                                  ▼
                           evaluate World timeline
```

Therefore two views can reference the same World while observing different world times.

Example:

```text
World: spinning logo
  rotation = 180° * worldTime

WEGRA A:
  worldTime = t

WEGRA B:
  worldTime = 2 + 0.5t
```

Both use the same World but observe different points in its evolution.

## Ownership rules

- World objects belong to the World.
- World animation belongs to the World timeline.
- A 3D View belongs to the containing WEGRA document.
- View presentation animation belongs to the main WEGRA timeline.
- View-to-world time mapping belongs to the 3D View instance.
- A WEGRA must not mutate a World's intrinsic timeline merely by changing the view's position, size, opacity, or time mapping.

## Reuse

A World reference is an asset relationship, not a copy operation. Multiple WEGRA documents may reference the same world identity. Exporting a WEGRA3D world creates a portable copy with its own serialized world state/history, while preserving the world's operation IDs and provenance.

## History implications

A mutation to a World is a World-history operation. A change to a View's `worldTime` mapping is a WEGRA/main-history operation.

Thus:

```text
rotate logo at world time 1.5
    → WEGRA3D world history

resize the logo's view at WEGRA time 4
    → WEGRA main history

change the view to play the world at 2× speed
    → WEGRA main history
```

A project history entry may reference a world operation using `worldId + operationId`, but it must not duplicate the world operation's payload.
