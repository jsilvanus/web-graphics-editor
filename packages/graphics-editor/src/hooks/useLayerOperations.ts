import { useCallback } from "react";
import type { GraphicsDocument, Layer, LayerType } from "../types";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack } from "../document";
import { linePath } from "../geometry/path";

function createLayer(type: LayerType): Layer {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "text") return { id, type, x: 160, y: 300, width: 1600, height: 180, text: "Text", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } };
  if (type === "image") return { id, type, x: 460, y: 300, width: 1000, height: 500 };
  if (type === "line") return { id, type, x: 660, y: 500, width: 600, height: 0, style: { stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" }, path: linePath(0, 0, 600, 0) };
  if (type === "path") return { id, type, x: 660, y: 400, width: 600, height: 300, pathCommands: [{ type: "M", x: 0, y: 0 }, { type: "L", x: 300, y: 0 }, { type: "L", x: 600, y: 300 }], style: { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" } };
  return { id, type, x: 460, y: 300, width: 1000, height: type === "ellipse" ? 440 : 500, style: { background: type === "ellipse" ? "#fff" : "#111" } };
}

export function useLayerOperations(setDocument: (next: GraphicsDocument | ((current: GraphicsDocument) => GraphicsDocument), history?: boolean) => void) {
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => setDocument(document => ({ ...document, layers: document.layers.map(layer => layer.id === id ? { ...layer, ...patch } : layer) })), [setDocument]);
  const updateStyle = useCallback((id: string, key: string, value: string | number) => setDocument(document => ({ ...document, layers: document.layers.map(layer => {
    if (layer.id !== id) return layer;
    const style = { ...(layer.style ?? {}) };
    if (value === "") delete style[key]; else style[key] = value;
    return { ...layer, style };
  }) })), [setDocument]);
  const add = useCallback((type: LayerType) => { const layer = createLayer(type); setDocument(document => ({ ...document, layers: [...document.layers, layer] })); return layer.id; }, [setDocument]);
  const remove = useCallback((ids: Set<string>) => setDocument(document => ({ ...document, layers: document.layers.filter(layer => !ids.has(layer.id)) })), [setDocument]);
  const duplicate = useCallback((ids: Set<string>) => { let copyIds: string[] = []; setDocument(document => { const selected = document.layers.filter(layer => ids.has(layer.id)); const copies = selected.map(layer => ({ ...layer, id: `${layer.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: layer.x + 30, y: layer.y + 30, style: layer.style ? { ...layer.style } : undefined, pathCommands: layer.pathCommands ? layer.pathCommands.map(command => ({ ...command })) : undefined })); copyIds = copies.map(layer => layer.id); return { ...document, layers: [...document.layers, ...copies] }; }); return copyIds; }, [setDocument]);
  const bringForward = useCallback((id: string) => setDocument(document => bringLayerForward(document, id)), [setDocument]);
  const sendBackward = useCallback((id: string) => setDocument(document => sendLayerBackward(document, id)), [setDocument]);
  const bringToFront = useCallback((id: string) => setDocument(document => bringLayerToFront(document, id)), [setDocument]);
  const sendToBack = useCallback((id: string) => setDocument(document => sendLayerToBack(document, id)), [setDocument]);
  return { updateLayer, updateStyle, add, remove, duplicate, bringForward, sendBackward, bringToFront, sendToBack };
}
