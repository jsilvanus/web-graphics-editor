import type { GraphicsDocument } from "../types";

export type ActorType = "ui" | "automation" | "mcp";
export interface Actor { type: ActorType; userId?: string }

export type DocumentOperation =
  | { type: "set-layer-property"; layerId: string; property: string; from: unknown; to: unknown }
  | { type: "move-layer"; layerId: string; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: "resize-layer"; layerId: string; from: { x:number;y:number;width:number;height:number }; to: { x:number;y:number;width:number;height:number } }
  | { type: "rotate-layer"; layerId: string; from: number; to: number }
  | { type: "add-layer"; layer: GraphicsDocument["layers"][number]; index?: number }
  | { type: "remove-layer"; layer: GraphicsDocument["layers"][number]; index: number };

export interface HistoryEntry { id: string; timestamp: number; label: string; actor: Actor; operation: DocumentOperation; }

export function applyOperation(document: GraphicsDocument, operation: DocumentOperation, reverse = false): GraphicsDocument {
  const value = (reverse && "from" in operation) ? operation.from : ("to" in operation ? operation.to : undefined);
  if (operation.type === "add-layer") {
    if (reverse) return { ...document, layers: document.layers.filter(l => l.id !== operation.layer.id) };
    const layers = [...document.layers]; layers.splice(operation.index ?? layers.length, 0, operation.layer); return { ...document, layers };
  }
  if (operation.type === "remove-layer") {
    if (reverse) { const layers=[...document.layers]; layers.splice(operation.index,0,operation.layer); return {...document,layers}; }
    return {...document,layers:document.layers.filter(l=>l.id!==operation.layer.id)};
  }
  const layers = document.layers.map(layer => {
    if (layer.id !== operation.layerId) return layer;
    if (operation.type === "move-layer") return {...layer,...(value as {x:number;y:number})};
    if (operation.type === "resize-layer") return {...layer,...(value as {x:number;y:number;width:number;height:number})};
    if (operation.type === "rotate-layer") return {...layer,rotation:value as number};
    if (operation.type === "set-layer-property") return {...layer,[operation.property]:value};
    return layer;
  });
  return {...document,layers};
}

export function invertOperation(operation: DocumentOperation): DocumentOperation {
  if (operation.type === "add-layer") return {type:"remove-layer",layer:operation.layer,index:operation.index ?? 0};
  if (operation.type === "remove-layer") return {type:"add-layer",layer:operation.layer,index:operation.index};
  if (operation.type === "move-layer") return {...operation,from:operation.to,to:operation.from};
  if (operation.type === "resize-layer") return {...operation,from:operation.to,to:operation.from};
  if (operation.type === "rotate-layer") return {...operation,from:operation.to,to:operation.from};
  return {...operation,from:operation.to,to:operation.from};
}
