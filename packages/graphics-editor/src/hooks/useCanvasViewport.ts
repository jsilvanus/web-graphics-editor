import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

export interface Viewport { zoom: number; panX: number; panY: number }
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export function useCanvasViewport(width:number,height:number){
  const [viewport,setViewport]=useState<Viewport>({zoom:1,panX:0,panY:0});
  const hostRef=useRef<HTMLDivElement|null>(null);
  const panRef=useRef<{x:number;y:number;startX:number;startY:number}|null>(null);
  const setZoomAt=useCallback((zoom:number,clientX?:number,clientY?:number)=>setViewport(v=>{
    const z=clamp(zoom,MIN_ZOOM,MAX_ZOOM);
    if(clientX===undefined||clientY===undefined)return {...v,zoom:z};
    const r=hostRef.current?.getBoundingClientRect(); if(!r)return {...v,zoom:z};
    const cx=clientX-r.left,cy=clientY-r.top;
    const docX=(cx-v.panX)/v.zoom,docY=(cy-v.panY)/v.zoom;
    return {zoom:z,panX:cx-docX*z,panY:cy-docY*z};
  }),[]);
  const onWheel=useCallback((e:ReactWheelEvent)=>{e.preventDefault();const factor=Math.exp(-e.deltaY*0.0015);setZoomAt(viewport.zoom*factor,e.clientX,e.clientY)},[setZoomAt,viewport.zoom]);
  const onPointerDown=useCallback((e:ReactPointerEvent)=>{
    if(e.button!==1 && !(e.button===0 && e.shiftKey && !e.target))return;
    e.preventDefault(); panRef.current={x:viewport.panX,y:viewport.panY,startX:e.clientX,startY:e.clientY}; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  },[viewport.panX,viewport.panY]);
  const onPointerMove=useCallback((e:ReactPointerEvent)=>{const p=panRef.current;if(!p)return;setViewport(v=>({...v,panX:p.x+e.clientX-p.startX,panY:p.y+e.clientY-p.startY}))},[]);
  const onPointerUp=useCallback(()=>{panRef.current=null},[]);
  const fit=useCallback(()=>{const r=hostRef.current?.getBoundingClientRect();if(!r)return;const z=Math.min((r.width-48)/width,(r.height-48)/height);setViewport({zoom:clamp(z,MIN_ZOOM,MAX_ZOOM),panX:(r.width-width*clamp(z,MIN_ZOOM,MAX_ZOOM))/2,panY:(r.height-height*clamp(z,MIN_ZOOM,MAX_ZOOM))/2})},[width,height]);
  const reset=useCallback(()=>fit(),[fit]);
  useEffect(()=>{const r=hostRef.current;if(!r)return;const ro=new ResizeObserver(()=>{setViewport(v=>v.zoom===1&&v.panX===0&&v.panY===0?v:v)});ro.observe(r);return()=>ro.disconnect()},[]);
  return {viewport,hostRef,onWheel,onPointerDown,onPointerMove,onPointerUp,setZoom:(z:number)=>setZoomAt(z),zoomIn:()=>setZoomAt(viewport.zoom*1.2),zoomOut:()=>setZoomAt(viewport.zoom/1.2),fit,reset};
}
