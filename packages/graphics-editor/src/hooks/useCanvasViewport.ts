import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
export interface Viewport { zoom:number; panX:number; panY:number }
const MIN_ZOOM=.1,MAX_ZOOM=8,clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function useCanvasViewport(width:number,height:number){
 const[viewport,setViewport]=useState<Viewport>({zoom:1,panX:0,panY:0});const hostRef=useRef<HTMLDivElement|null>(null);const panRef=useRef<{x:number;y:number;startX:number;startY:number}|null>(null);const spaceRef=useRef(false);
 useEffect(()=>{const d=(e:KeyboardEvent)=>{if(e.code==="Space")spaceRef.current=true},u=(e:KeyboardEvent)=>{if(e.code==="Space")spaceRef.current=false};window.addEventListener("keydown",d);window.addEventListener("keyup",u);return()=>{window.removeEventListener("keydown",d);window.removeEventListener("keyup",u)}},[]);
 const setZoomAt=useCallback((zoom:number,cx?:number,cy?:number)=>setViewport(v=>{const z=clamp(zoom,MIN_ZOOM,MAX_ZOOM);if(cx===undefined||cy===undefined)return{...v,zoom:z};const r=hostRef.current?.getBoundingClientRect();if(!r)return{...v,zoom:z};const x=cx-r.left,y=cy-r.top,dx=(x-v.panX)/v.zoom,dy=(y-v.panY)/v.zoom;return{zoom:z,panX:x-dx*z,panY:y-dy*z}}),[]);
 const onWheel=useCallback((e:ReactWheelEvent)=>{e.preventDefault();setZoomAt(viewport.zoom*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},[setZoomAt,viewport.zoom]);
 const onPointerDown=useCallback((e:ReactPointerEvent)=>{if(e.button!==1&&!(e.button===0&&spaceRef.current))return;e.preventDefault();panRef.current={x:viewport.panX,y:viewport.panY,startX:e.clientX,startY:e.clientY};(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)},[viewport.panX,viewport.panY]);
 const onPointerMove=useCallback((e:ReactPointerEvent)=>{const p=panRef.current;if(p)setViewport(v=>({...v,panX:p.x+e.clientX-p.startX,panY:p.y+e.clientY-p.startY}))},[]);const onPointerUp=useCallback(()=>{panRef.current=null},[]);
 const fit=useCallback(()=>{const r=hostRef.current?.getBoundingClientRect();if(!r)return;const z=clamp(Math.min((r.width-48)/width,(r.height-48)/height),MIN_ZOOM,MAX_ZOOM);setViewport({zoom:z,panX:(r.width-width*z)/2,panY:(r.height-height*z)/2})},[width,height]);
 return{viewport,hostRef,onWheel,onPointerDown,onPointerMove,onPointerUp,setZoom:(z:number)=>setZoomAt(z),zoomIn:()=>setZoomAt(viewport.zoom*1.2),zoomOut:()=>setZoomAt(viewport.zoom/1.2),fit,reset:fit};
}
