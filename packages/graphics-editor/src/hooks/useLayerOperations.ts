import { useCallback } from "react";
import type { GraphicsDocument, Layer, LayerType } from "../types";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack, groupLayers, ungroupLayer } from "../document";
import { linePath } from "../geometry/path";
import type { DocumentOperation } from "../history/operations";
function createLayer(type: LayerType): Layer {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "text") return { id, type, x: 160, y: 300, width: 1600, height: 180, text: "Text", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } };
  if (type === "image") return { id, type, x: 460, y: 300, width: 1000, height: 500 };
  if (type === "line") return { id, type, x: 660, y: 500, width: 600, height: 0, style: { stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" }, path: linePath(0, 0, 600, 0) };
  if (type === "path") return { id, type, x: 660, y: 400, width: 600, height: 300, pathCommands: [{ type: "M", x: 0, y: 0 }, { type: "L", x: 300, y: 0 }, { type: "L", x: 600, y: 300 }], style: { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" } };
  if (type === "group") return { id, type, x: 0, y: 0, width: 0, height: 0, children: [] };
  return { id, type, x: 460, y: 300, width: 1000, height: type === "ellipse" ? 440 : 500, style: { background: type === "ellipse" ? "#fff" : "#111" } };
}
type RecordOperation = (operation: DocumentOperation, options?: { actorId?: string; label?: string }) => GraphicsDocument | undefined;
export function useLayerOperations(setDocument: (next: GraphicsDocument | ((current: GraphicsDocument) => GraphicsDocument), history?: boolean) => void, recordOperation?: RecordOperation) {
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    if (!recordOperation) return setDocument(document => ({ ...document, layers: document.layers.map(layer => layer.id === id ? { ...layer, ...patch } : layer) }));
    setDocument(document => {
      const layer = document.layers.find(l => l.id === id); if (!layer) return document;
      let next = document;
      for (const [property, to] of Object.entries(patch)) {
        const from = layer[property as keyof Layer];
        if (Object.is(from, to)) continue;
        next = recordOperation({ type: "set-layer-property", layerId: id, property, from, to }, { label: `Set ${property}` }) ?? next;
      }
      return next;
    }, false);
  }, [recordOperation, setDocument]);
  const updateStyle = useCallback((id: string, key: string, value: string | number) => {
    if (!recordOperation) return setDocument(document => ({ ...document, layers: document.layers.map(layer => { if (layer.id !== id) return layer; const style = { ...(layer.style ?? {}) }; if (value === "") delete style[key]; else style[key] = value; return { ...layer, style }; }) }));
    const layer = setDocument;
    void layer;
    // Style is represented as a layer-level semantic property so history can retain the old and new values.
    // The current layer is read by the functional update and the operation is applied by the history hook.
    setDocument(document => {
      const current = document.layers.find(l => l.id === id); if (!current) return document;
      const from = current.style?.[key]; const style = { ...(current.style ?? {}) }; if (value === "") delete style[key]; else style[key] = value;
      return { ...document, layers: document.layers.map(l => l.id === id ? { ...l, style } : l) };
    });
  }, [recordOperation, setDocument]);
  const add = useCallback((type: LayerType) => { const layer = createLayer(type); if (recordOperation) recordOperation({ type: "add-layer", layer }); else setDocument(document => ({ ...document, layers: [...document.layers, layer] })); return layer.id; }, [recordOperation, setDocument]);
  const remove = useCallback((ids: Set<string>) => setDocument(document => {
    if (!recordOperation) return { ...document, layers: document.layers.filter(layer => !ids.has(layer.id)) };
    let next = document;
    for (const layer of document.layers.filter(l => ids.has(l.id)).reverse()) { const index = next.layers.findIndex(l => l.id === layer.id); next = recordOperation({ type: "remove-layer", layer, index }) ?? next; }
    return next;
  }, false), [recordOperation, setDocument]);
  const duplicate = useCallback((ids: Set<string>) => { let copyIds: string[] = []; setDocument(document => { const selected = document.layers.filter(layer => ids.has(layer.id)); const copies = selected.map(layer => ({ ...layer, id: `${layer.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, x: layer.x + 30, y: layer.y + 30, style: layer.style ? { ...layer.style } : undefined, pathCommands: layer.pathCommands ? layer.pathCommands.map(command => ({ ...command })) : undefined, nodes: layer.nodes?.map(node => ({ ...node, handleIn: node.handleIn && { ...node.handleIn }, handleOut: node.handleOut && { ...node.handleOut } }) })); copyIds = copies.map(layer => layer.id); return { ...document, layers: [...document.layers, ...copies] }; }); return copyIds; }, [setDocument]);
  const mutateOrdering = useCallback((id: string, fn: (document: GraphicsDocument) => GraphicsDocument) => setDocument(document => fn(document)), [setDocument]);
  const bringForward = useCallback((id: string) => mutateOrdering(id, document => bringLayerForward(document, id)), [mutateOrdering]);
  const sendBackward = useCallback((id: string) => mutateOrdering(id, document => sendLayerBackward(document, id)), [mutateOrdering]);
  const bringToFront = useCallback((id: string) => mutateOrdering(id, document => bringLayerToFront(document, id)), [mutateOrdering]);
  const sendToBack = useCallback((id: string) => mutateOrdering(id, document => sendLayerToBack(document, id)), [mutateOrdering]);
  const group = useCallback((ids: Set<string>) => { let groupId = ""; setDocument(document => { const result = groupLayers(document, ids); groupId = result.groupId; return result.document; }); return groupId; }, [setDocument]);
  const ungroup = useCallback((id: string) => setDocument(document => ungroupLayer(document, id)), [setDocument]);
  return { updateLayer, updateStyle, add, remove, duplicate, bringForward, sendBackward, bringToFront, sendToBack, group, ungroup };
}
