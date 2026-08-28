# Future AI / MCP Architecture

## Goal

Keep the graphics editor structured so that a future AI can create and modify projects through MCP without requiring a redesign of the editor.

MCP is **not implemented yet**. This document is an architectural constraint for ongoing development.

## Architecture

```text
React UI ───────┐
                ├──> Graphics Domain API ──> GraphicsDocument
Future MCP ─────┘
```

The domain API should be the single place for meaningful document mutations. The UI and a future MCP server should consume the same operations.

## Principles

- Keep the document model declarative: describe what the graphic is, not how the UI created it.
- Give all meaningful entities stable IDs: layers, groups, paths/nodes, scenes, tracks, keyframes and clips.
- Keep mutations separate from rendering.
- Prefer reusable, programmatic domain operations over UI-only logic.
- Keep `.wegra` as the canonical native project representation.
- Preserve still graphics and timelines in the same document model, with animation optional.

## Domain operations

The eventual domain API should cover operations such as:

- Layers: create, update, delete, reorder, group, ungroup.
- Paths: create, add/update nodes, handles, close path, corner radius.
- Scenes: create, duplicate, insert, delete, duration and transitions.
- Timeline: tracks, clips, keyframes, duplication and looping.
- Projects: open/save `.wegra`, SVG import/export and raster export.

## Future MCP

When MCP is added, expose high-level, useful tools rather than mirroring every internal function. Examples include:

- `get_document`, `list_layers`, `get_layer`, `list_scenes`, `get_scene`, `get_timeline`
- `create_rectangle`, `create_text`, `create_path`, `update_layer`, `group_layers`, `reorder_layer`
- `add_path_node`, `update_path_node`, `set_path_handle`, `set_corner_radius`
- `create_scene`, `duplicate_scene`, `insert_empty_scene`, `set_scene_duration`
- `create_animation_track`, `add_keyframe`, `move_keyframe`, `delete_keyframe`
- `save_project`, `open_project`, `export_svg`, `export_png`

Eventually, add higher-level creative operations such as `create_lower_third`, `make_rounded_box`, `align`, `distribute`, `animate_in`, and `animate_out`, implemented on top of the lower-level domain operations.

## Development rule

For each new editor feature, ask: **Can this operation be expressed cleanly without the React UI?** If not, consider refactoring before adding more UI-specific logic.

The objective is for a future MCP layer to be thin: AI -> MCP -> domain API -> document, with the existing editor UI using that same domain API.