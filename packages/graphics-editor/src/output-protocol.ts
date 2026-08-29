import type { OutputBackgroundMode, OutputPlaybackMode } from "./types";
import type { OutputRuntime, OutputRuntimeState } from "./outputs-runtime";

export type OutputCommand =
  | { type: "output.take"; outputId: string }
  | { type: "output.takeOff"; outputId: string }
  | { type: "output.play"; outputId: string }
  | { type: "output.pause"; outputId: string }
  | { type: "output.seek"; outputId: string; time: number }
  | { type: "output.reset"; outputId: string }
  | { type: "output.setPlayback"; outputId: string; playback: OutputPlaybackMode }
  | { type: "output.setBackground"; outputId: string; background: OutputBackgroundMode };

export type OutputEvent =
  | { type: "output.state"; outputId: string; state: OutputRuntimeState; time: number; transitionProgress: number }
  | { type: "output.ack"; outputId: string; command: OutputCommand["type"] }
  | { type: "output.error"; outputId?: string; command?: OutputCommand["type"]; code: "not_found" | "not_allowed" | "invalid"; message: string };

export function isOutputCommand(value: unknown): value is OutputCommand {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.type !== "string" || typeof v.outputId !== "string") return false;
  switch (v.type) {
    case "output.take": case "output.takeOff": case "output.play": case "output.pause": case "output.reset": return true;
    case "output.seek": return typeof v.time === "number" && Number.isFinite(v.time);
    case "output.setPlayback": return ["static", "automatic", "user", "live"].includes(v.playback as string);
    case "output.setBackground": return v.background === "transparent" || v.background === "opaque";
    default: return false;
  }
}

export function outputStateEvent(runtime: OutputRuntime, transitionProgress = 0): OutputEvent {
  return { type: "output.state", outputId: runtime.outputId, state: runtime.state, time: runtime.time, transitionProgress };
}
