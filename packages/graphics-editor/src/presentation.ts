import type { Composition, GraphicsDocument, Layer, Scene, SceneTimeline, Viewport, ViewportOverride } from "./types";

export interface ResolvedLayer extends Layer { sourceLayerId:string; }
export interface ResolvedComposition { composition:Composition; layers:ResolvedLayer[]; }
export interface ResolvedScene { scene:Scene; composition:Composition; localTime:number; layers:ResolvedLayer[]; }

export function findComposition(document:GraphicsDocument, compositionId:string|undefined):Composition|undefined {
  return (document.compositions??[]).find(c=>c.id===compositionId);
}

export function findViewport(document:GraphicsDocument, viewportId:string|undefined):Viewport|undefined {
  return (document.viewports??[]).find(v=>v.id===viewportId);
}

export function resolveComposition(document:GraphicsDocument, compositionId:string|undefined):ResolvedComposition|undefined {
  const composition=findComposition(document,compositionId); if(!composition) return undefined;
  const byId=new Map(document.layers.map(layer=>[layer.id,layer]));
  const layers=composition.layerIds.map(id=>byId.get(id)).filter((layer):layer is Layer=>Boolean(layer)).map(layer=>({...layer,sourceLayerId:layer.id}));
  return {composition,layers};
}

export function viewportOverride(layer:Layer,viewportId:string|undefined):ViewportOverride|undefined {
  return viewportId?layer.viewportOverrides?.[viewportId]:undefined;
}

export function resolveViewportComposition(document:GraphicsDocument,viewportId:string|undefined,compositionId?:string):ResolvedComposition|undefined {
  const viewport=findViewport(document,viewportId); const selectedId=compositionId??viewport?.compositionIds?.[0];
  const resolved=resolveComposition(document,selectedId); if(!resolved) return undefined;
  if(!viewportId) return resolved;
  return {...resolved,layers:resolved.layers.map(layer=>({...layer,...viewportOverride(layer,viewportId)}))};
}

export function sceneAtTime(timeline:SceneTimeline|undefined,time:number):Scene|undefined {
  if(!timeline||!timeline.scenes.length) return undefined;
  const duration=timeline.scenes.reduce((max,s)=>Math.max(max,s.start+s.duration),0);
  let t=Math.max(0,time);
  if(timeline.loop&&duration>0) t=t%duration;
  return timeline.scenes.find(scene=>t>=scene.start&&t<scene.start+scene.duration)??timeline.scenes[timeline.scenes.length-1];
}

export function resolveScene(document:GraphicsDocument,time:number,viewportId?:string):ResolvedScene|undefined {
  const scene=sceneAtTime(document.timeline,time); if(!scene) return undefined;
  const resolved=resolveViewportComposition(document,viewportId,scene.compositionId); if(!resolved) return undefined;
  const localTime=Math.max(0,time-scene.start);
  return {scene,composition:resolved.composition,localTime,layers:resolved.layers};
}

export function resolveOutput(document:GraphicsDocument,outputId:string,time:number=0):ResolvedScene|ResolvedComposition|undefined {
  const output=document.outputs?.find(item=>item.id===outputId); if(!output) return undefined;
  if(document.timeline?.scenes.length) return resolveScene(document,time,output.viewportId);
  return resolveViewportComposition(document,output.viewportId);
}
