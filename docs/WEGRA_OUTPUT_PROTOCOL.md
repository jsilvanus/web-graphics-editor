# WEGRA Output Control Protocol

## Purpose

The output protocol is the domain-level command/event contract between a WEGRA runtime and an external host or transport. It does not prescribe WebSocket, HTTP, postMessage, or any other transport.

## Commands

- `output.take` — enter an output using its configured in-transition.
- `output.takeOff` — leave an output using its configured out-transition.
- `output.play` — start playback for automatic/user/live output runtime.
- `output.pause` — pause playback.
- `output.seek` — set the output clock to an explicit time.
- `output.reset` — restore runtime to its initial state.
- `output.setPlayback` — change the persistent playback mode.
- `output.setBackground` — change transparent/opaque presentation.

All commands identify an `outputId`. Commands are independent of transport and may be mapped to WebSocket messages, HTTP requests, browser `postMessage`, local calls, or future MCP operations.

## Events

`output.state` reports the current runtime state, output clock and transition progress.

`output.ack` confirms accepted commands.

`output.error` reports rejected commands with a stable error code: `not_found`, `not_allowed`, or `invalid`.

## Runtime boundary

The persistent `GraphicsOutput` is document data. `OutputRuntime` is ephemeral runtime state. Commands mutate runtime state unless explicitly changing persistent output configuration (`setPlayback`, `setBackground`). Runtime events are not document history entries.

## Transport boundary

A host application owns authentication, authorization, connection lifecycle, reconnection, routing, rate limiting and transport framing. WEGRA owns command validation, output semantics, runtime transitions and rendering state.

## Example

```json
{"type":"output.take","outputId":"lower-third"}
```

A host may receive:

```json
{"type":"output.state","outputId":"lower-third","state":"entering","time":12.4,"transitionProgress":0.35}
```

When the transition completes:

```json
{"type":"output.state","outputId":"lower-third","state":"on","time":12.8,"transitionProgress":1}
```
