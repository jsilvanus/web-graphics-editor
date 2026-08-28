import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { WIDTH } from "../constants";
import { snap } from "../geometry";
import type { GraphicsDocument, Layer } from "../types";

export type CanvasDrag={kind:string;layerId:string;selectedIds:string[];startX:number;startY:number;layers:Layer[];scale:number;left:number;top:number;centerX:number;centerY:number;};
function bounds(layers:Layer[]){const x=Math.min(...layers.map(l=>l.x)),y=Math.min(...layers.map(l=>l.y)),r=Math.max(...layers.map(l=>l.x+l.width)),b=Math.max(...layers.map(l=>l.y+l.height));return{x,y,width:r-x,height:b-y};}
function rotatePoint(x:number,y:number,cx:number,cy:number,a:number){const r=a*Math.PI/180,dx=x-cx,dy=y-cy;return{x:cx+dx*Math.cos(r)-dy*Math.sin(r),y:cy+dx*Math.sin(r)+dy*Math.cos(r)};}
export function useCanvasInteraction(document:GraphicsDocument,artboardRef:RefObject<HTMLDivElement|null>,grid:boolean,aspectLock:boolean,onChange:(next:GraphicsDocument)=>void,selectedIds:Set<string>=new Set()){
 const dragRef=useRef<CanvasDrag|null>(null);
 const pointerDown=useCallback((event:ReactPointerEvent,id:string,kind:string,handle?:string)=>{event.stopPropagation();const layer=document.layers.find(x=>x.id===id),rect=artboardRef.current?.getBoundingClientRect();if(!layer||!rect?.width)return;const selected=document.layers.filter(x=>selectedIds.has(x.id));const layers=selected.length>1&&selectedIds.has(id)?selected:[layer],b=bounds(layers);dragRef.current={kind,layerId:id,selectedIds:layers.map(x=>x.id),startX:event.clientX,startY:event.clientY,layers:layers.map(x=>({...x})),scale:rect.width/(document.width||WIDTH),left:rect.left,top:rect.top,centerX:b.x+b.width/2,centerY:b.y+b.height/2};(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)},[artboardRef,document,selectedIds]);
 const pointerMove=useCallback((event:ReactPointerEvent)=>{const d=dragRef.current;if(!d)return;const dx=(event.clientX-d.startX)/d.scale,dy=(event.clientY-d.startY)/d.scale;let nextLayers=d.layers.map(l=>({...l}));
  if(d.kind==="move"){let mx=dx,my=dy;if(grid){mx=snap(d.layers[0].x+mx)-d.layers[0].x;my=snap(d.layers[0].y+my)-d.layers[0].y}nextLayers=nextLayers.map(l=>({...l,x:Math.round(l.x+mx),y:Math.round(l.y+my)}));}
  else if(d.kind==="resize"){const h=(event.currentTarget as HTMLElement).dataset.handle??"se";let sx=1,sy=1,ox=d.centerX,oy=d.centerY;const start=bounds(d.layers);if(h.includes("e")){sx=(start.width+dx)/start.width;ox=start.x}else if(h.includes("w")){sx=(start.width-dx)/start.width;ox=start.x+start.width}if(h.includes("s")){sy=(start.height+dy)/start.height;oy=start.y}else if(h.includes("n")){sy=(start.height-dy)/start.height;oy=start.y+start.height}if(event.shiftKey||aspectLock){const s=Math.max(0.05,Math.abs(Math.abs(sx-1)>Math.abs(sy-1)?sx:sy));sx=(sx<0?-1:1)*s;sy=(sy<0?-1:1)*s}nextLayers=nextLayers.map(l=>({...l,x:Math.round(ox+(l.x-(h.includes("e")||h.includes("w")?ox:d.centerX))*sx),y:Math.round(oy+(l.y-(h.includes("n")||h.includes("s")?oy:d.centerY))*sy),width:Math.max(20,Math.round(l.width*Math.abs(sx))),height:Math.max(20,Math.round(l.height*Math.abs(sy)))}));}
  else {const px=(event.clientX-d.left)/d.scale,py=(event.clientY-d.top)/d.scale;let a=Math.atan2(py-d.centerY,px-d.centerX)*180/Math.PI;const startA=Math.atan2((d.startY-d.top)/d.scale-d.centerY,(d.startX-d.left)/d.scale-d.centerX)*180/Math.PI;let delta=a-startA;if(grid||event.shiftKey)delta=Math.round(delta/15)*15;nextLayers=nextLayers.map(l=>{const p=rotatePoint(l.x+l.width/2,l.y+l.height/2,d.centerX,d.centerY,delta);return{...l,x:Math.round(p.x-l.width/2),y:Math.round(p.y-l.height/2),rotation:(l.rotation??0)+delta}})}
  const ids=new Set(d.selectedIds);onChange({...document,layers:document.layers.map(l=>ids.has(l.id)?(nextLayers.find(n=>n.id===l.id)??l):l)});
 },[document,grid,aspectLock,onChange]);
 const pointerUp=useCallback(()=>{dragRef.current=null},[]);return{pointerDown,pointerMove,pointerUp};
}
