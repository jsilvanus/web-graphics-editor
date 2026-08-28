import { useCallback } from "react";
import { alignLayers, distributeLayers, type AlignMode, type AlignReference, type DistributeMode } from "../alignment";
import type { GraphicsDocument } from "../types";
import { useLayerOperations } from "./useLayerOperations";

type SetDocument=(next:GraphicsDocument|((current:GraphicsDocument)=>GraphicsDocument),history?:boolean)=>void;

export function useLayerCommands(document:GraphicsDocument,setDocument:SetDocument,commit:(next:GraphicsDocument)=>void,selectedIds:Set<string>,primaryId:string|null,select:(id:string)=>void,clear:()=>void){
 const {add,remove,duplicate,bringForward,sendBackward,bringToFront,sendToBack,group,ungroup}=useLayerOperations(setDocument);
 const addLayer=useCallback((type:Parameters<typeof add>[0])=>{const id=add(type);select(id)},[add,select]);
 const deleteSelected=useCallback(()=>{if(!selectedIds.size)return;const viewIds=document.layers.filter(l=>selectedIds.has(l.id)&&l.type==="3d-view").map(l=>l.view3dId).filter(Boolean) as string[];remove(selectedIds);if(viewIds.length)commit({...document,views3d:(document.views3d??[]).filter(v=>!viewIds.includes(v.id))});clear()},[selectedIds,document,remove,commit,clear]);
 const duplicateSelected=useCallback(()=>{if(!selectedIds.size)return;const ids=duplicate(selectedIds);if(ids.length)select(ids[0])},[selectedIds,duplicate,select]);
 const applyAlign=useCallback((mode:AlignMode,reference:AlignReference)=>{if(selectedIds.size<1)return;commit({...document,layers:alignLayers(document.layers,selectedIds,mode,reference,document.width,document.height)})},[selectedIds,document,commit]);
 const applyDistribute=useCallback((mode:DistributeMode)=>{if(selectedIds.size<3)return;commit({...document,layers:distributeLayers(document.layers,selectedIds,mode)})},[selectedIds,document,commit]);
 return {add,remove,duplicate,bringForward,sendBackward,bringToFront,sendToBack,group,ungroup,addLayer,deleteSelected,duplicateSelected,applyAlign,applyDistribute};
}
