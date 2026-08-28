import type { GraphicsDocument, Layer } from "../types";
export type ActorType = "human" | "ai" | "automation";
export interface Actor { type: ActorType; userId?: string; source?: string }
export interface ActorVocabularyEntry { type: ActorType; userId?: string; pseudonym: string }
export interface ActorVocabulary { actors: Record<string, ActorVocabularyEntry> }
export type DocumentOperation =
  | { type: "set-layer-property"; layerId: string; property: string; from: unknown; to: unknown }
  | { type: "set-layer-style"; layerId: string; property: string; from: unknown; to: unknown }
  | { type: "move-layer"; layerId: string; from: { x:number;y:number }; to: { x:number;y:number } }
  | { type: "resize-layer"; layerId: string; from: { x:number;y:number;width:number;height:number }; to: { x:number;y:number;width:number;height:number } }
  | { type: "rotate-layer"; layerId: string; from: number; to: number }
  | { type: "add-layer"; layer: Layer; index?: number }
  | { type: "remove-layer"; layer: Layer; index: number };
export interface HistoryEntry { id:string;timestamp:number;label:string;actor:string;operation:DocumentOperation }
export function applyOperation(document:GraphicsDocument,operation:DocumentOperation,reverse=false):GraphicsDocument{
 const value=(reverse&&"from"in operation)?operation.from:("to"in operation?operation.to:undefined);
 if(operation.type==="add-layer"){if(reverse)return{...document,layers:document.layers.filter(l=>l.id!==operation.layer.id)};const layers=[...document.layers];layers.splice(operation.index??layers.length,0,operation.layer);return{...document,layers}}
 if(operation.type==="remove-layer"){if(reverse){const layers=[...document.layers];layers.splice(operation.index,0,operation.layer);return{...document,layers}}return{...document,layers:document.layers.filter(l=>l.id!==operation.layer.id)}}
 return{...document,layers:document.layers.map(layer=>{if(layer.id!==operation.layerId)return layer;if(operation.type==="set-layer-style"){const style={...(layer.style??{})};if(value===undefined||value==="")delete style[operation.property];else style[operation.property]=value as string|number;return{...layer,style}}if(operation.type==="move-layer")return{...layer,...(value as{x:number;y:number})};if(operation.type==="resize-layer")return{...layer,...(value as{x:number;y:number;width:number;height:number})};if(operation.type==="rotate-layer")return{...layer,rotation:value as number};if(operation.type==="set-layer-property")return{...layer,[operation.property]:value};return layer})};
}
export function invertOperation(operation:DocumentOperation):DocumentOperation{if(operation.type==="add-layer")return{type:"remove-layer",layer:operation.layer,index:operation.index??0};if(operation.type==="remove-layer")return{type:"add-layer",layer:operation.layer,index:operation.index};return{...operation,from:operation.to,to:operation.from}}

/** Convert a completed document mutation into semantic history operations. */
export function diffOperations(before:GraphicsDocument,after:GraphicsDocument):DocumentOperation[]{
 const ops:DocumentOperation[]=[];
 const beforeById=new Map(before.layers.map((l,i)=>[l.id,{layer:l,index:i}]));
 const afterById=new Map(after.layers.map((l,i)=>[l.id,{layer:l,index:i}]));
 for(const [id,{layer,index}] of beforeById){if(!afterById.has(id))ops.push({type:"remove-layer",layer,index})}
 for(const [id,{layer,index}] of afterById){if(!beforeById.has(id))ops.push({type:"add-layer",layer,index})}
 for(const [id,{layer:beforeLayer}] of beforeById){const afterLayer=afterById.get(id)?.layer;if(!afterLayer)continue;
  if(beforeLayer.x!==afterLayer.x||beforeLayer.y!==afterLayer.y)ops.push({type:"move-layer",layerId:id,from:{x:beforeLayer.x,y:beforeLayer.y},to:{x:afterLayer.x,y:afterLayer.y}});
  if(beforeLayer.width!==afterLayer.width||beforeLayer.height!==afterLayer.height)ops.push({type:"resize-layer",layerId:id,from:{x:beforeLayer.x,y:beforeLayer.y,width:beforeLayer.width,height:beforeLayer.height},to:{x:afterLayer.x,y:afterLayer.y,width:afterLayer.width,height:afterLayer.height}});
  if((beforeLayer.rotation??0)!==(afterLayer.rotation??0))ops.push({type:"rotate-layer",layerId:id,from:beforeLayer.rotation??0,to:afterLayer.rotation??0});
  const keys=new Set([...Object.keys(beforeLayer.style??{}),...Object.keys(afterLayer.style??{})]);for(const key of keys){const from=beforeLayer.style?.[key],to=afterLayer.style?.[key];if(!Object.is(from,to))ops.push({type:"set-layer-style",layerId:id,property:key,from,to})}
  for(const key of Object.keys(afterLayer) as (keyof Layer)[]){if(["id","type","x","y","width","height","rotation","style"].includes(key as string))continue;const from=beforeLayer[key],to=afterLayer[key];if(!Object.is(from,to))ops.push({type:"set-layer-property",layerId:id,property:key as string,from,to})}
 }
 return ops;
}
