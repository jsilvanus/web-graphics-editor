# WEGRA History Reference Model

**Status:** Draft v0.1

## Purpose

WEGRA and WEGRA3D have history at different resource scopes, but project history must not duplicate world mutations.

- `.wegra` history is the chronological project history.
- `.wegra3d` history is the authoritative history of mutations inside a world.
- A WEGRA project history entry referencing a world mutation stores the `worldId` and the world's operation ID.
- Operation IDs are globally unique so references remain unambiguous across package boundaries.

## Model

```text
WEGRA project history
        │
        ├── project operation
        ├── project operation
        ├── world-operation reference ─────┐
        └── project operation              │
                                           ▼
                                  WEGRA3D world history
                                           │
                                           ├── world operation
                                           └── world operation
```

## Operation identity

Every persistent history operation has a globally unique `id`. The ID identifies the operation, not its position in a particular history file.

Recommended representation:

```ts
interface HistoryOperation {
  id: string;
  timestamp: string;
  actor?: string;
  type: string;
  payload?: unknown;
}
```

The exact ID generation algorithm is implementation detail, but IDs must be stable across serialization, import and export.

## World operation reference

A project history entry that represents a mutation inside an embedded world uses:

```ts
interface WorldOperationReference {
  type: "world-operation";
  worldId: string;
  operationId: string;
}
```

Example:

```json
{
  "id": "op-project-42",
  "timestamp": "2026-08-29T12:00:00Z",
  "actor": "actor-001",
  "type": "world-operation",
  "worldId": "world-kitchen",
  "operationId": "op-world-187"
}
```

The actual mutation remains in:

```text
worlds3d/world-kitchen/history/operations.jsonl
```

## Undo/redo

The project history provides the chronological ordering needed for project-level undo/redo. When the referenced operation belongs to a world, the world operation is resolved and applied/reverted through the world operation system.

The editor's in-memory undo stack may use checkpoints or other optimizations; the persistent operation IDs remain the stable identity of the edits.

## Import/export

When a `.wegra3d` world is imported, its operation IDs are retained. The containing WEGRA project records the import as a project operation and subsequently records world mutations as references.

When a world is exported back to `.wegra3d`, its world operation IDs remain intact. Project-only operations are not copied into the world history.

## Provenance

Provenance may reference operation IDs to connect an asset/resource's origin with the edits that produced it. History answers what changed; provenance answers where content came from and how it was derived.
