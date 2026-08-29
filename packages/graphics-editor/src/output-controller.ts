import type { GraphicsOutput, OutputBackgroundMode, OutputPlaybackMode } from "./types";
import { dispatchOutputRuntime, outputTransitionProgress, type OutputRuntime } from "./outputs-runtime";
import type { OutputCommand, OutputEvent } from "./output-protocol";
import { outputStateEvent } from "./output-protocol";

export interface OutputControllerOptions {
  getOutput: (outputId: string) => GraphicsOutput | undefined;
  updateOutput?: (outputId: string, changes: Partial<Pick<GraphicsOutput, "playback" | "background">>) => GraphicsOutput | undefined;
  now?: () => number;
}

export type OutputEventListener = (event: OutputEvent) => void;

export class OutputController {
  private readonly options: OutputControllerOptions;
  private readonly runtimes = new Map<string, OutputRuntime>();
  private readonly listeners = new Set<OutputEventListener>();
  private readonly now: () => number;

  constructor(options: OutputControllerOptions) {
    this.options = options;
    this.now = options.now ?? (() => Date.now());
  }

  subscribe(listener: OutputEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getRuntime(outputId: string): OutputRuntime | undefined {
    return this.runtimes.get(outputId);
  }

  initialize(outputId: string): OutputRuntime | undefined {
    const output = this.options.getOutput(outputId);
    if (!output) return undefined;
    const runtime = this.runtimes.get(outputId);
    if (runtime) return runtime;
    const initial = dispatchOutputRuntime({ outputId, state: "off", time: output.defaultTime ?? 0, transitionTime: 0, direction: null, updatedAt: this.now() }, output, { type: "RESET" });
    this.runtimes.set(outputId, initial);
    return initial;
  }

  dispatch(command: OutputCommand): OutputEvent[] {
    const output = this.options.getOutput(command.outputId);
    if (!output) return [this.error("not_found", `Output ${command.outputId} was not found`, command)];
    if ((command.type === "output.take" || command.type === "output.takeOff") && !output.liveControl) return [this.error("not_allowed", "Live control is disabled for this output", command)];
    let runtime = this.runtimes.get(command.outputId) ?? this.initialize(command.outputId)!;
    let events: OutputEvent[] = [];
    switch (command.type) {
      case "output.take": runtime = dispatchOutputRuntime(runtime, output, { type: "TAKE" }); break;
      case "output.takeOff": runtime = dispatchOutputRuntime(runtime, output, { type: "TAKE_OFF" }); break;
      case "output.play": runtime = dispatchOutputRuntime(runtime, output, { type: "PLAY" }); break;
      case "output.pause": runtime = dispatchOutputRuntime(runtime, output, { type: "PAUSE" }); break;
      case "output.seek": runtime = dispatchOutputRuntime(runtime, output, { type: "SEEK", time: command.time }); break;
      case "output.reset": runtime = dispatchOutputRuntime(runtime, output, { type: "RESET" }); break;
      case "output.setPlayback": {
        const updated = this.options.updateOutput?.(command.outputId, { playback: command.playback });
        if (!updated) return [this.error("not_allowed", "Persistent output configuration cannot be changed by this controller", command)];
        runtime = this.runtimes.get(command.outputId) ?? this.initialize(command.outputId)!;
        break;
      }
      case "output.setBackground": {
        const updated = this.options.updateOutput?.(command.outputId, { background: command.background });
        if (!updated) return [this.error("not_allowed", "Persistent output configuration cannot be changed by this controller", command)];
        runtime = this.runtimes.get(command.outputId) ?? this.initialize(command.outputId)!;
        break;
      }
    }
    this.runtimes.set(command.outputId, runtime);
    events.push({ type: "output.ack", outputId: command.outputId, command: command.type });
    events.push(outputStateEvent(runtime, outputTransitionProgress(runtime, output)));
    this.emit(events);
    return events;
  }

  tick(delta: number): OutputEvent[] {
    if (!Number.isFinite(delta) || delta <= 0) return [];
    const events: OutputEvent[] = [];
    for (const [outputId, runtime] of this.runtimes) {
      const output = this.options.getOutput(outputId);
      if (!output) continue;
      const next = dispatchOutputRuntime(runtime, output, { type: "TICK", delta });
      this.runtimes.set(outputId, { ...next, updatedAt: this.now() });
      events.push(outputStateEvent(next, outputTransitionProgress(next, output)));
    }
    this.emit(events);
    return events;
  }

  private error(code: "not_found" | "not_allowed" | "invalid", message: string, command?: OutputCommand): OutputEvent {
    return { type: "output.error", outputId: command?.outputId, command: command?.type, code, message };
  }

  private emit(events: OutputEvent[]) { for (const event of events) for (const listener of this.listeners) listener(event); }
}

export type { OutputBackgroundMode, OutputPlaybackMode };
