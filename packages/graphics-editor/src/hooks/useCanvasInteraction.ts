import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { WIDTH } from "../constants";
import { snap } from "../geometry";
import { referenceSnap } from "../referenceSnapping";
import { getReferenceId } from "../referenceStore";
import { getLayerTreeIds } from "../document";
import { getLayerBounds, type LayerBounds } from "../layer-bounds";
import type { GraphicsDocument, Layer } from "../types";

export type CanvasDrag={kind:string;layerId:string;selectedIds:string[];handle?:string;startX:number;startY:number;layers:Layer[];scale:number;left:number;top:number;centerX:number;centerY:number;startBounds:LayerBounds};
function bounds(layers:Layer[]){const x=Math.min(...layers.map(l=>l.x)),y=Math.min(...layers.map(l=>l.y)),r=Math.max(...layers.map(l=>l.x+l.width)),b=Math.max(...layers.map(l=>l.y+l.height));return{x,y,width:r-x,height:b-y};}
function selectionBounds(document:GraphicsDocument,layers:Layer[]){
 const boxes=layers.map(layer=>layer.type==="group"?getLayerBounds(document.layers,layer.id):null).map((box,i)=>box??bounds([layers[i]]));
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),r=Math.max(...boxes.map(b=>b.x+b.width)),b=Math.max(...boxes.map(b=>b.y+b.height));
 return{x,y,width:r-x,height:b-y};
}
function rotatePoint(x:number,y:number,cx:number,cy:number,a:number){const r=a*Math.PI/180,dx=x-cx,dy=y-cy;return{x:cx+dx*Math.cos(r)-dy*Math.sin(r),y:cy+dx*Math.sin(r)+dy*Math.cos(r)};}
export function useCanvasInteraction(document:GraphicsDocument,artboardRef:RefObject<HTMLDivElement|null>,grid:boolean,aspectLock:boolean,onChange:(next:GraphicsDocument)=>void,selectedIds:Set<string>=new Set()){
 const dragRef=useRef<CanvasDrag|null>(null);
 const pointerDown=useCallback((event:ReactPointerEvent,id:string,kind:string,handle?:string)=>{event.stopPropagation();const layer=document.layers.find(x=>x.id===id),rect=artboardRef.current?.getBoundingClientRect();if(!layer||!rect?.width)return;const selected=document.layers.filter(x=>selectedIds.has(x.id));const layers=selected.length>1&&selectedIds.has(id)?selected:[layer],b=selectionBounds(document,layers);const dragIds=new Set<string>();layers.forEach(l=>getLayerTreeIds(document,l.id).forEach(childId=>dragIds.add(childId)));const dragLayers=document.layers.filter(l=>dragIds.has(l.id));dragRef.current={kind,layerId:id,selectedIds:[...dragIds],handle,startX:event.clientX,startY:event.clientY,layers:dragLayers.map(x=>({...x})),scale:rect.width/(document.width||WIDTH),left:rect.left,top:rect.top,centerX:b.x+b.width/2,centerY:b.y+b.height/2,startBounds:b};(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)},[artboardRef,document,selectedIds]);
 const pointerMove=useCallback((event:ReactPointerEvent)=>{const d=dragRef.current;if(!d)return;const dx=(event.clientX-d.startX)/d.scale,dy=(event.clientY-d.startY)/d.scale;let next=d.layers.map(l=>({...l}));
  if(d.kind==="move"){let mx=dx,my=dy;if(grid){mx=snap(d.layers[0].x+mx)-d.layers[0].x;my=snap(d.layers[0].y+my)-d.layers[0].y}
   const referenceId=getReferenceId(),referenceLayer=referenceId?document.layers.find(l=>l.id===referenceId):null;
   if(referenceLayer&&!d.selectedIds.includes(referenceLayer.id)){const moved={...d.layers[0],x:d.layers[0].x+mx,y:d.layers[0].y+my};const s=referenceSnap(moved,referenceLayer,{edges:true,centers:true,angle:true,threshold:10});mx=s.x-d.layers[0].x;my=s.y-d.layers[0].y;}
   next=next.map(l=>({...l,x:Math.round(l.x+mx),y:Math.round(l.y+my)}));
  }
  else if(d.kind==="resize"){const h=d.handle??"se",start=d.startBounds,alt=event.altKey;let sx=1,sy=1,ax=d.centerX,ay=d.centerY;if(h.includes("e"))sx=(start.width+dx)/Math.max(1,start.width);else if(h.includes("w")){sx=(start.width-dx)/Math.max(1,start.width);ax=alt?d.centerX:start.x+start.width}if(h.includes("s"))sy=(start.height+dy)/Math.max(1,start.height);else if(h.includes("n")){sy=(start.height-dy)/Math.max(1,start.height);ay=alt?d.centerY:start.y+start.height}if(!alt){if(h.includes("e"))ax=start.x;if(h.includes("w"))ax=start.x+start.width;if(h.includes("s"))ay=start.y;if(h.includes("n"))ay=start.y+start.height;}if(event.shiftKey||aspectLock){const s=Math.max(.05,Math.abs(Math.abs(sx-1)>Math.abs(sy-1)?sx:sy));sx=(sx<0?-1:1)*s;sy=(sy<0?-1:1)*s}next=next.map(l=>{const x=Math.round(ax+(l.x-ax)*sx),y=Math.round(ay+(l.y-ay)*sy);return{...l,x,y,width:Math.max(20,Math.round(l.width*Math.abs(sx))),height:Math.max(20,Math.round(l.height*Math.abs(sy)))}});}
  else {const px=(event.clientX-d.left)/d.scale,py=(event.clientY-d.top)/d.scale;const startA=Math.atan2((d.startY-d.top)/d.scale-d.centerY,(d.startX-d.left)/d.scale-d.centerX)*180/Math.PI;let delta=Math.atan2(py-d.centerY,px-d.centerX)*180/Math.PI-startA;if(grid||event.shiftKey)delta=Math.round(delta/15)*15;next=next.map(l=>{const p=rotatePoint(l.x+l.width/2,l.y+l.height/2,d.centerX,d.centerY,delta);return{...l,x:Math.round(p.x-l.width/2),y:Math.round(p.y-l.height/2),rotation:(l.rotation??0)+delta}});}
  const ids=new Set(d.selectedIds);onChange({...document,layers:document.layers.map(l=>ids.has(l.id)?(next.find(n=>n.id===l.id)??l):l)});
 },[document,grid,aspectLock,onChange]);
 const pointerUp=useCallback(()=>{dragRef.current=null},[]);return{pointerDown,pointerMove,pointerUp};
}
