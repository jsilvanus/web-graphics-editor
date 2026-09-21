import type { GraphicsDocument, Layer } from "../types";
import { alignLayers, distributeLayers, type AlignMode, type AlignReference, type DistributeMode } from "../alignment";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack, groupLayers, ungroupLayer, updateLayer, updateLayerStyle } from "./operations";
import { diffOperations, type DocumentOperation, type GroupChildSnapshot } from "../history/operations";
import { offsetPathNodes } from "../geometry";
import { booleanContours, pathNodesToPolygon, type BooleanOperation, type PolygonPoint } from "../geometry/boolean";

export interface CommandResult { document: GraphicsDocument; operation?: DocumentOperation }
function batchOrSingle(operations: DocumentOperation[]): DocumentOperation | undefined { return operations.length === 1 ? operations[0] : operations.length ? { type: "batch", operations } : undefined; }

export function updateLayerCommand(document: GraphicsDocument, id: string, patch: Partial<Layer>): CommandResult {
  let next = document; const operations: DocumentOperation[] = [];
  for (const [property, to] of Object.entries(patch)) { const from = document.layers.find(layer => layer.id === id)?.[property as keyof Layer]; if (Object.is(from, to)) continue; next = updateLayer(next, id, { [property]: to } as Partial<Layer>); operations.push({ type: "set-layer-property", layerId: id, property, from, to }); }
  return { document: next, operation: batchOrSingle(operations) };
}

export function updateLayerStyleCommand(document: GraphicsDocument, id: string, key: string, value: string | number | undefined): CommandResult {
  const layer = document.layers.find(item => item.id === id); if (!layer) return { document }; const from = layer.style?.[key]; if (Object.is(from, value)) return { document };
  if (value === undefined) { const style = { ...(layer.style ?? {}) }; delete style[key]; return { document: updateLayer(document, id, { style }), operation: { type: "set-layer-style", layerId: id, property: key, from, to: value } }; }
  return { document: updateLayerStyle(document, id, key, value), operation: { type: "set-layer-style", layerId: id, property: key, from, to: value } };
}

export function reorderLayerCommand(document: GraphicsDocument, id: string, action: "forward" | "backward" | "front" | "back"): CommandResult {
  const index = document.layers.findIndex(layer => layer.id === id); if (index < 0) return { document };
  const targetIndex = action === "forward" ? Math.min(index + 1, document.layers.length - 1) : action === "backward" ? Math.max(index - 1, 0) : action === "front" ? document.layers.length - 1 : 0; if (targetIndex === index) return { document };
  const next = action === "forward" ? bringLayerForward(document, id) : action === "backward" ? sendLayerBackward(document, id) : action === "front" ? bringLayerToFront(document, id) : sendLayerToBack(document, id);
  return { document: next, operation: { type: "reorder-layer", layerId: id, fromIndex: index, toIndex: targetIndex } };
}

function childSnapshots(document: GraphicsDocument, ids: string[]): GroupChildSnapshot[] {
  return document.layers.flatMap((layer, index) => ids.includes(layer.id) ? [{ layer, index }] : []);
}

export function groupLayersCommand(document: GraphicsDocument, ids: Set<string>): CommandResult {
  const result = groupLayers(document, ids); if (!result.groupId) return { document };
  const children = childSnapshots(document, [...ids].filter(id => document.layers.some(layer => layer.id === id && layer.type !== "group")));
  const index = children.length ? Math.min(...children.map(child => child.index)) : 0;
  const group = result.document.layers.find(layer => layer.id === result.groupId)!;
  return { document: result.document, operation: { type: "group-layers", group, children, index } };
}

export function ungroupLayerCommand(document: GraphicsDocument, id: string): CommandResult {
  const group = document.layers.find(layer => layer.id === id && layer.type === "group"); if (!group?.children?.length) return { document };
  const children = childSnapshots(document, group.children); const index = document.layers.findIndex(layer => layer.id === id);
  return { document: ungroupLayer(document, id), operation: { type: "ungroup-layer", group: { ...group }, children, index } };
}

export function removeLayerCommand(document: GraphicsDocument, id: string): CommandResult { const index = document.layers.findIndex(layer => layer.id === id); if (index < 0) return { document }; return { document: { ...document, layers: document.layers.filter(layer => layer.id !== id) }, operation: { type: "remove-layer", layer: document.layers[index], index } }; }
export function addLayerCommand(document: GraphicsDocument, layer: Layer, index?: number): CommandResult { const target = Math.max(0, Math.min(index ?? document.layers.length, document.layers.length)); const layers = [...document.layers]; layers.splice(target, 0, layer); return { document: { ...document, layers }, operation: { type: "add-layer", layer, index: target } }; }
export function alignLayersCommand(document: GraphicsDocument, ids: Set<string>, mode: AlignMode, reference: AlignReference): CommandResult { const layers = alignLayers(document.layers, ids, mode, reference, document.width, document.height); const next = layers === document.layers ? document : { ...document, layers }; return { document: next, operation: batchOrSingle(diffOperations(document, next)) }; }
export function distributeLayersCommand(document: GraphicsDocument, ids: Set<string>, mode: DistributeMode): CommandResult { const layers = distributeLayers(document.layers, ids, mode); const next = layers === document.layers ? document : { ...document, layers }; return { document: next, operation: batchOrSingle(diffOperations(document, next)) }; }


function layerPolygon(layer: Layer): PolygonPoint[] | null {
  if (layer.type === "path" && layer.nodes) {
    const polygon = pathNodesToPolygon(layer.nodes, !!layer.closed);
    return polygon?.map(p => ({ x: p.x + layer.x, y: p.y + layer.y })) ?? null;
  }
  if (layer.type === "rectangle") {
    return [{x:layer.x,y:layer.y},{x:layer.x+layer.width,y:layer.y},{x:layer.x+layer.width,y:layer.y+layer.height},{x:layer.x,y:layer.y+layer.height}];
  }
  if (layer.type === "ellipse") {
    return Array.from({length:64},(_,i)=>{const a=i*Math.PI*2/64;return{x:layer.x+layer.width/2+Math.cos(a)*layer.width/2,y:layer.y+layer.height/2+Math.sin(a)*layer.height/2}});
  }
  return null;
}

export function moveLayerCommand(document: GraphicsDocument, id: string, targetId: string, position: "inside" | "before" | "after"): CommandResult {
  if (id === targetId) return { document };
  const moving = document.layers.find(layer => layer.id === id);
  const target = document.layers.find(layer => layer.id === targetId);
  if (!moving || !target || moving.locked) return { document };
  const descendants = new Set<string>();
  const visit = (layerId: string) => { if (descendants.has(layerId)) return; descendants.add(layerId); const layer = document.layers.find(item => item.id === layerId); layer?.children?.forEach(visit); };
  visit(id);
  if (descendants.has(targetId)) return { document };
  const parentId = position === "inside" ? target.id : target.parentId;
  const parent = parentId ? document.layers.find(layer => layer.id === parentId && layer.type === "group") : undefined;
  if (position === "inside" && target.type !== "group") return { document };
  if (parentId && !parent) return { document };
  let next = { ...document, layers: document.layers.map(layer => ({ ...layer, children: layer.children ? [...layer.children] : layer.children })) };
  const oldParent = moving.parentId ? next.layers.find(layer => layer.id === moving.parentId) : undefined;
  if (oldParent?.children) oldParent.children = oldParent.children.filter(childId => childId !== id);
  const updatedMoving = { ...moving, parentId: parentId || undefined };
  next.layers = next.layers.map(layer => layer.id === id ? updatedMoving : layer);
  const container = parentId ? next.layers.find(layer => layer.id === parentId) : undefined;
  if (container?.children) {
    container.children = container.children.filter(childId => childId !== id);
    if (position === "inside") container.children.push(id);
    else { const index = container.children.indexOf(targetId); container.children.splice(Math.max(0, position === "before" ? index : index + 1), 0, id); }
  } else if (!parentId) {
    const top = next.layers.filter(layer => !layer.parentId && !descendants.has(layer.id));
    const targetIndex = top.findIndex(layer => layer.id === targetId);
    const desired = Math.max(0, position === "before" ? targetIndex : targetIndex + 1);
    const order = top.map(layer => layer.id).filter(layerId => layerId !== id);
    order.splice(desired, 0, id);
    const byId = new Map(next.layers.map(layer => [layer.id, layer]));
    const rest = next.layers.filter(layer => layer.parentId || descendants.has(layer.id));
    next.layers = [...order.map(layerId => byId.get(layerId)!), ...rest];
  }
  return { document: next, operation: { type: "batch", operations: diffOperations(document, next) } };
}

export function booleanLayersCommand(document: GraphicsDocument, ids: string[], operation: BooleanOperation): CommandResult {
  if (ids.length !== 2) return { document };
  const a = document.layers.find(layer => layer.id === ids[0]), b = document.layers.find(layer => layer.id === ids[1]);
  if (!a || !b || a.locked || b.locked) return { document };
  const pa = layerPolygon(a), pb = layerPolygon(b);
  if (!pa || !pb) return { document };
  const contours = booleanContours(pa, pb, operation);
  if (!contours.length) return { document };
  const allPoints = contours.flatMap(contour => contour.points);
  const minX=Math.min(...allPoints.map(p=>p.x)), minY=Math.min(...allPoints.map(p=>p.y)), maxX=Math.max(...allPoints.map(p=>p.x)), maxY=Math.max(...allPoints.map(p=>p.y));
  const commands: import("../types").PathCommand[] = [];
  for (const contour of contours) {
    const points = contour.points.map(p => ({x:p.x-minX,y:p.y-minY}));
    if (!points.length) continue;
    commands.push({type:"M",x:points[0].x,y:points[0].y});
    for (const point of points.slice(1)) commands.push({type:"L",x:point.x,y:point.y});
    commands.push({type:"Z"});
  }
  const baseStyle = { ...(a.style ?? {}), "fill-rule": contours.some(contour => contour.hole) ? "evenodd" : String(a.style?.["fill-rule"] ?? "nonzero") };
  const copy = { ...a, id: `boolean-${operation}-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, type:"path" as const, x:minX,y:minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),nodes:undefined,path:undefined,pathCommands:commands,closed:true,style:baseStyle };
  const copies = [copy];
  const next={...document,layers:document.layers.filter(layer=>layer.id!==a.id&&layer.id!==b.id).concat(copies)};
  return { document: next, operation: batchOrSingle(diffOperations(document,next)) };
}


export function joinPathLayersCommand(document: GraphicsDocument, ids: string[]): CommandResult {
  if (ids.length !== 2) return { document };
  const a = document.layers.find(layer => layer.id === ids[0]);
  const b = document.layers.find(layer => layer.id === ids[1]);
  if (!a || !b || a.type !== "path" || b.type !== "path" || a.locked || b.locked || a.closed || b.closed || !a.nodes?.length || !b.nodes?.length) return { document };
  if (a.parentId !== b.parentId) return { document };
  const aWorld = a.nodes.map(n => ({ ...n, x: n.x + a.x, y: n.y + a.y, handleIn: n.handleIn && { x:n.handleIn.x+a.x, y:n.handleIn.y+a.y }, handleOut: n.handleOut && { x:n.handleOut.x+a.x, y:n.handleOut.y+a.y } }));
  const bWorld = b.nodes.map(n => ({ ...n, x: n.x + b.x, y: n.y + b.y, handleIn: n.handleIn && { x:n.handleIn.x+b.x, y:n.handleIn.y+b.y }, handleOut: n.handleOut && { x:n.handleOut.x+b.x, y:n.handleOut.y+b.y } }));
  const all = [...aWorld, ...bWorld];
  const minX=Math.min(...all.map(n=>n.x)), minY=Math.min(...all.map(n=>n.y)), maxX=Math.max(...all.map(n=>n.x)), maxY=Math.max(...all.map(n=>n.y));
  const nodes = all.map(n => ({ ...n, x:n.x-minX, y:n.y-minY, handleIn:n.handleIn&&{x:n.handleIn.x-minX,y:n.handleIn.y-minY}, handleOut:n.handleOut&&{x:n.handleOut.x-minX,y:n.handleOut.y-minY} }));
  const next={...document,layers:document.layers.filter(layer=>layer.id!==b.id).map(layer=>layer.id===a.id?{...layer,x:minX,y:minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),nodes,path:undefined,pathCommands:undefined,closed:false}:layer)};
  return { document: next, operation: batchOrSingle(diffOperations(document,next)) };
}

export function offsetPathCommand(document: GraphicsDocument, id: string, distance: number): CommandResult { const layer=document.layers.find(l=>l.id===id); if(!layer || layer.type!=="path" || !layer.nodes?.length || !Number.isFinite(distance) || distance===0) return {document}; const nodes=offsetPathNodes(layer.nodes,distance,!!layer.closed); const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys); const normalized=nodes.map(n=>({...n,x:n.x-minX,y:n.y-minY})); const next=updateLayer(document,id,{x:layer.x+minX,y:layer.y+minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),nodes:normalized,path:undefined,pathCommands:undefined}); return {document:next,operation:batchOrSingle(diffOperations(document,next))}; }

export function convertLayerToPathCommand(document: GraphicsDocument, id: string): CommandResult {
  const layer=document.layers.find(l=>l.id===id);
  if(!layer || (layer.type!=="rectangle" && layer.type!=="ellipse")) return {document};
  let nodes: import("../types").PathNode[];
  if(layer.type==="rectangle") nodes=[{x:0,y:0,kind:"corner"},{x:layer.width,y:0,kind:"corner"},{x:layer.width,y:layer.height,kind:"corner"},{x:0,y:layer.height,kind:"corner"}];
  else {
    const k=.5522847498,rx=layer.width/2,ry=layer.height/2,cx=rx,cy=ry;
    nodes=[
      {x:cx,y:0,kind:"smooth",handleIn:{x:cx-k*rx,y:0},handleOut:{x:cx+k*rx,y:0}},
      {x:layer.width,y:cy,kind:"smooth",handleIn:{x:layer.width,y:cy-k*ry},handleOut:{x:layer.width,y:cy+k*ry}},
      {x:cx,y:layer.height,kind:"smooth",handleIn:{x:cx+k*rx,y:layer.height},handleOut:{x:cx-k*rx,y:layer.height}},
      {x:0,y:cy,kind:"smooth",handleIn:{x:0,y:cy+k*ry},handleOut:{x:0,y:cy-k*ry}}
    ];
  }
  const next=updateLayer(document,id,{type:"path",nodes,closed:true,path:undefined,pathCommands:undefined});
  return {document:next,operation:batchOrSingle(diffOperations(document,next))};
}

export function convertPathToShapeCommand(document: GraphicsDocument, id: string): CommandResult {
  const layer=document.layers.find(l=>l.id===id);
  if(!layer || layer.type!=="path" || !layer.nodes?.length) return {document};
  const nodes=layer.nodes;
  const minX=Math.min(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y)),maxX=Math.max(...nodes.map(n=>n.x)),maxY=Math.max(...nodes.map(n=>n.y));
  const rectangleLike=nodes.length===4 && nodes.every(n=>!n.handleIn&&!n.handleOut);
  const ellipseLike=nodes.length===4 && nodes.every(n=>n.kind==="smooth" && n.handleIn && n.handleOut);
  if(!rectangleLike && !ellipseLike) return {document};
  const next=updateLayer(document,id,{type:ellipseLike?"ellipse":"rectangle",x:layer.x+minX,y:layer.y+minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),nodes:undefined,path:undefined,pathCommands:undefined,closed:undefined});
  return {document:next,operation:batchOrSingle(diffOperations(document,next))};
}
