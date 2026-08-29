import { useCallback } from "react";
import type { GraphicsDocument, Layer } from "../types";
import type { AnimatedProperty } from "../timeline";
import { updateLayerCommand, updateLayerStyleCommand } from "../document/commands";
import { setAnimatedPropertyAtTime } from "../document/timelineCommands";
import type { DocumentOperation } from "../history/operations";

export const ANIMATED_PROPERTIES: AnimatedProperty[] = ["x", "y", "width", "height", "rotation", "opacity"];
type ExecuteCommand = (command: { document: GraphicsDocument; operation?: DocumentOperation }, options?: { label?: string }) => GraphicsDocument | undefined;

export function useAnimatedLayerEditing(document: GraphicsDocument, executeCommand: ExecuteCommand, currentTime: number) {
  const changeLayer = useCallback((id: string, patch: Partial<Layer>) => {
    let current = document;
    for (const [property, rawValue] of Object.entries(patch)) {
      if (ANIMATED_PROPERTIES.includes(property as AnimatedProperty) && typeof rawValue === "number" && current.timeline?.tracks.some(track => track.layerId === id && track.property === property)) {
        const result = setAnimatedPropertyAtTime(current, id, property as AnimatedProperty, currentTime, rawValue);
        if (result.operation) { current = result.document; executeCommand(result, { label: `Set ${property} at ${currentTime.toFixed(2)}s` }); }
      } else {
        const result = updateLayerCommand(current, id, { [property]: rawValue } as Partial<Layer>);
        if (result.operation) { current = result.document; executeCommand(result, { label: `Set ${property}` }); }
      }
    }
  }, [document, executeCommand, currentTime]);

  const changeStyle = useCallback((id: string, key: string, value: string | number) => {
    if (key === "opacity" && typeof value === "number" && document.timeline?.tracks.some(track => track.layerId === id && track.property === "opacity")) {
      const result = setAnimatedPropertyAtTime(document, id, "opacity", currentTime, value);
      if (result.operation) executeCommand(result, { label: `Set opacity at ${currentTime.toFixed(2)}s` });
      return;
    }
    const result = updateLayerStyleCommand(document, id, key, value);
    if (result.operation) executeCommand(result, { label: `Set ${key}` });
  }, [document, executeCommand, currentTime]);

  return { changeLayer, changeStyle };
}
