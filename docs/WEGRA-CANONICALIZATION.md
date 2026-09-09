# WEGRA canonicalization and migrations

## Status

Implemented for the native `.wegra` package serializer.

## Canonical serialization

The native WEGRA serializer emits schema version 2. Canonical JSON:

- recursively sorts object keys;
- preserves array order because arrays such as layers and keyframes are semantic;
- rejects non-finite numbers instead of silently converting them to `null`;
- emits no serialization-time timestamps or UI/renderer state;
- sorts package entries by path before writing the ZIP;
- sorts manifest asset references.

Consequently, serializing the same domain state produces byte-identical output as long as externally fetched assets resolve to the same bytes.

Canonicalization is intentionally a domain-format concern. React state, renderer objects and caches are never part of the canonical representation.

## Versioning

`WEGRA_VERSION` is the native package schema version. It is independent of the editor/application version.

The current version is **2**. Version 1 packages remain readable.

```text
v1 package
   │
   ▼
manifest migration registry
   │
   ▼
v2 canonical domain model
   │
   ▼
current editor
```

## Migration registry

Migrations are registered explicitly in `WEGRA_MIGRATIONS` and applied sequentially by `migrateWegraManifest()`.

The first migration is:

```text
1 → 2
```

It upgrades the package schema version while preserving the v1 resource layout. The loader then exposes a normalized v2 manifest to the rest of the application.

Future incompatible changes must add a new migration rather than scattering version checks through UI or renderer code. A migration should be deterministic, side-effect free, and limited to schema compatibility.

## Compatibility rules

- A package with a version newer than the current version is rejected.
- A package with an unknown historical version is rejected rather than guessed.
- Arrays retain their semantic order unless a future schema explicitly defines them as unordered.
- Stable IDs remain identities; package paths are storage locations.
- Re-saving an older package writes the current canonical version.

## API

The package exports:

- `canonicalJson()`
- `migrateWegraManifest()`
- `WEGRA_MIGRATIONS`
- `WEGRA_VERSION`
- `SUPPORTED_WEGRA_VERSIONS`

These APIs keep serialization and compatibility testable independently of the editor UI.
