import { describe, expect, it } from "vitest";
import type { GraphicsDocument, Layer } from "../types";
import { addLayerCommand } from "../document/commands";
import { appendHistory, createHistory, reconstructVersion } from "./store";

const layer = (id: string, x = 0): Layer => ({ id, type: "rectangle", x, y: 0, width: 100, height: 100 });
const document = (...layers: Layer[]): GraphicsDocument => ({ width: 1920, height: 1080, background: "#111", layers });

function add(history: ReturnType<typeof createHistory>, current: GraphicsDocument, id: string, checkpointInterval = 50) {
  const result = addLayerCommand(current, layer(id, current.layers.length * 10));
  return {
    history: appendHistory(history, result.document, result.operation!, "test", `add ${id}`, checkpointInterval),
    document: result.document,
  };
}

describe("DocumentHistory", () => {
  it("reconstructs every version from the initial checkpoint", () => {
    let history = createHistory(document());
    let current = document();
    const versions = [current];

    for (const id of ["a", "b", "c", "d"]) {
      const next = add(history, current, id);
      history = next.history;
      current = next.document;
      versions.push(current);
    }

    versions.forEach((version, index) => {
      expect(reconstructVersion(history, index)).toEqual(version);
    });
  });

  it("reconstructs correctly across checkpoints", () => {
    let history = createHistory(document());
    let current = document();
    const versions = [current];

    for (const id of ["a", "b", "c", "d"]) {
      const next = add(history, current, id, 2);
      history = next.history;
      current = next.document;
      versions.push(current);
    }

    expect(history.checkpoints.map(checkpoint => checkpoint.operationIndex)).toEqual([0, 2, 4]);
    versions.forEach((version, index) => {
      expect(reconstructVersion(history, index)).toEqual(version);
    });
  });

  it("clamps requested versions to the available history range", () => {
    let history = createHistory(document());
    let current = document();
    const next = add(history, current, "a");
    history = next.history;
    current = next.document;

    expect(reconstructVersion(history, -10)).toEqual(document());
    expect(reconstructVersion(history, 100)).toEqual(current);
  });

  it("does not mutate the stored checkpoint during reconstruction", () => {
    const initial = document(layer("a"));
    let history = createHistory(initial);
    const next = add(history, initial, "b");
    history = next.history;

    expect(reconstructVersion(history, 0)).toEqual(initial);
    expect(history.checkpoints[0].document).toEqual(initial);
    expect(history.entries).toHaveLength(1);
  });
});
