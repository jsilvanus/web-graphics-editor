import { useCallback } from "react";
import type { GraphicsDocument, Layer, LayerType } from "../types";
import { bringLayerForward, bringLayerToFront, sendLayerBackward, sendLayerToBack, groupLayers, ungroupLayer } from "../document";
import { linePath } from "../geometry/path";
import type { DocumentOperation } from "../history/operations";
function createLayer(type: LayerType): Layer {
  const id=`${type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  if(type==="text")return{id,type,x:160,y:300,width:1600,height:180,text:"Text",style:{"font-size":"92px","font-weight":700,color:"#fff","text-align":"center"}};
  if(type==="image")return{id,type,x:460,y:300,width:1000,height:500};
  if(type==="line")return{id,type,x:660,y:500,width:600,height:0,style:{stroke:"#fff","stroke-width":4,"stroke-linecap":"round"},path:linePath(0,0,600,0)};
  if(type==="path")return{id,type,x:660,y:400,width:600,height:300,pathCommands:[{type:"M",x:0,y:0},{type:"L",x:300,y:0},{type:"L",x:600,y:300}],style:{fill:"none",stroke:"#fff","stroke-width":4,"stroke-linejoin":"round","stroke-linecap":"round"}};
  if(type==="group")return{id,type,x:0,y:0,width:0,height:0,children:[]};
  return{id,type,x:460,y:300,width:1000,height:type==="ellipse"?440:500,style:{background:type==="ellipse"?"#fff":"#111"}};
}
type RecordOperation=(operation:DocumentOperation,options?:{actorId?:string;label?:string})=>GraphicsDocument|undefined;
export function useLayerOperations(setDocument:(next:GraphicsDocument|((current:GraphicsDocument)=>GraphicsDocument),history?:boolean)=>void,recordOperation?:RecordOperation,document?:GraphicsDocument){
 const updateLayer=useCallback((id:string,patch:Partial<Layer>)=>{
  if(!recordOperation||!document)return setDocument(d=>({...d,layers:d.layers.map(l=>l.id===id?{...l,...patch}:l)}));
  for(const[property,to]of Object.entries(patch)){const from=document.layers.find(l=>l.id===id)?.[property as keyof Layer];if(Object.is(from,to))continue;recordOperation({type:"set-layer-property",layerId:id,property,from,to},{label:`Set ${property}`});}
 },[recordOperation,setDocument,document]);
 const updateStyle=useCallback((id:string,key:string,value:string|number)=>{
  if(!recordOperation||!document)return setDocument(d=>({...d,layers:d.layers.map(l=>{if(l.id!==id)return l;const style={...(l.style??{})};if(value==="")delete style[key];else style[key]=value;return{...l,style}})}));
  const from=document.layers.find(l=>l.id===id)?.style?.[key];if(Object.is(from,value))return;recordOperation({type:"set-layer-style",layerId:id,property:key,from,to:value},{label:`Set ${key}`});
 },[recordOperation,setDocument,document]);
 const add=useCallback((type:LayerType)=>{const layer=createLayer(type);if(recordOperation)recordOperation({type:"add-layer",layer},{label:`Add ${type}`});else setDocument(d=>({...d,layers:[...d.layers,layer]}));return layer.id},[recordOperation,setDocument]);
 const remove=useCallback((ids:Set<string>)=>{if(!recordOperation||!document)return setDocument(d=>({...d,layers:d.layers.filter(l=>!ids.has(l.id))}));for(const layer of document.layers.filter(l=>ids.has(l.id)).reverse()){const index=document.layers.findIndex(l=>l.id===layer.id);recordOperation({type:"remove-layer",layer,index},{label:`Remove ${layer.type}`})}},[recordOperation,setDocument,document]);
 const duplicate=useCallback((ids:Set<string>)=>{const selected=(document?.layers??[]).filter(l=>ids.has(l.id));const copies=selected.map(layer=>({...layer,id:`${layer.type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,x:layer.x+30,y:layer.y+30,style:layer.style?{...layer.style}:undefined,pathCommands:layer.pathCommands?.map(command=>({...command})),nodes:layer.nodes?.map(node=>({...node,handleIn:node.handleIn&&{...node.handleIn},handleOut:node.handleOut&&{...node.handleOut}}))}));if(recordOperation)copies.forEach(layer=>recordOperation({type:"add-layer",layer},{label:"Duplicate layer"}));else setDocument(d=>({...d,layers:[...d.layers,...copies]}));return copies.map(l=>l.id)},[recordOperation,setDocument,document]);
 const mutateOrdering=useCallback((id:string,fn:(d:GraphicsDocument)=>GraphicsDocument)=>setDocument(d=>fn(d)),[setDocument]);
 const bringForward=useCallback((id:string)=>mutateOrdering(id,d=>bringLayerForward(d,id)),[mutateOrdering]);
 const sendBackward=useCallback((id:string)=>mutateOrdering(id,d=>sendLayerBackward(d,id)),[mutateOrdering]);
 const bringToFront=useCallback((id:string)=>mutateOrdering(id,d=>bringLayerToFront(d,id)),[mutateOrdering]);
 const sendToBack=useCallback((id:string)=>mutateOrdering(id,d=>sendLayerToBack(d,id)),[mutateOrdering]);
 const group=useCallback((ids:Set<string>)=>{let groupId="";setDocument(d=>{const result=groupLayers(d,ids);groupId=result.groupId;return result.document});return groupId},[setDocument]);
 const ungroup=useCallback((id:string)=>setDocument(d=>ungroupLayer(d,id)),[setDocument]);
 return{updateLayer,updateStyle,add,remove,duplicate,bringForward,sendBackward,bringToFront,sendToBack,group,ungroup};
}
