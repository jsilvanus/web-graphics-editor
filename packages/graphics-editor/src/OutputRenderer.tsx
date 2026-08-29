import { useEffect, useMemo, useRef, useState, type CSSProperties, type FC } from "react";
import type { GraphicsDocument, GraphicsOutput } from "./types";
import { CanvasLayerStack } from "./components/canvas/CanvasLayerStack";
import { createOutputRuntime, dispatchOutputRuntime, outputTransitionProgress, type OutputRuntime } from "./outputs-runtime";

export interface OutputRendererProps {
  document: GraphicsDocument;
  output: GraphicsOutput;
  showControls?: boolean;
  className?: string;
  style?: CSSProperties;
  onRuntimeChange?: (runtime: OutputRuntime) => void;
}

const transitionStyle=(output:GraphicsOutput,runtime:OutputRuntime):CSSProperties=>{
  const p=outputTransitionProgress(runtime,output);
  if(runtime.state!=="entering"&&runtime.state!=="exiting")return{};
  const type=runtime.direction==="in"?output.inTransition?.type:output.outTransition?.type;
  const progress=runtime.direction==="out"?1-p:p;
  switch(type){
    case "slide-left":return{opacity:progress,transform:`translateX(${(1-progress)*-100}%)`};
    case "slide-right":return{opacity:progress,transform:`translateX(${(1-progress)*100}%)`};
    case "slide-up":return{opacity:progress,transform:`translateY(${(1-progress)*-100}%)`};
    case "slide-down":return{opacity:progress,transform:`translateY(${(1-progress)*100}%)`};
    case "fade":case "dissolve":return{opacity:progress};
    default:return{};
  }
};

export const OutputRenderer:FC<OutputRendererProps>=({document,output,showControls=false,className,style,onRuntimeChange})=>{
  const [runtime,setRuntime]=useState<OutputRuntime>(()=>createOutputRuntime(output));
  const frame=useRef<number>();
  const last=useRef<number>();
  const runtimeRef=useRef(runtime); runtimeRef.current=runtime;
  const background=output.background==="transparent"?"transparent":document.background??"#000";
  const transition=useMemo(()=>transitionStyle(output,runtime),[output,runtime]);

  useEffect(()=>{setRuntime(createOutputRuntime(output));last.current=undefined},[output.id,output.playback,output.defaultTime]);
  useEffect(()=>{onRuntimeChange?.(runtime)},[runtime,onRuntimeChange]);
  useEffect(()=>{
    const loop=(now:number)=>{const previous=last.current??now;last.current=now;const delta=Math.min(.1,Math.max(0,(now-previous)/1000));const current=runtimeRef.current;if(delta>0&&(current.playing||current.state==="entering"||current.state==="exiting")){const next=dispatchOutputRuntime(current,output,{type:"TICK",delta});if(next!==current)setRuntime(next)}frame.current=requestAnimationFrame(loop)};
    frame.current=requestAnimationFrame(loop);return()=>{if(frame.current!==undefined)cancelAnimationFrame(frame.current);frame.current=undefined;last.current=undefined};
  },[output]);

  const command=(event:Parameters<typeof dispatchOutputRuntime>[2])=>setRuntime(r=>dispatchOutputRuntime(r,output,event));
  const rootStyle:CSSProperties={position:"relative",width:"100%",aspectRatio:`${document.width}/${document.height}`,overflow:"hidden",background,...style};
  const artboardStyle:CSSProperties={position:"absolute",inset:0,width:"100%",height:"100%",transformOrigin:"center center",...transition};
  const controls=showControls&&output.playback!=="static"&&<div style={{position:"absolute",zIndex:1000,left:8,bottom:8,display:"flex",gap:6}}><button type="button" onClick={()=>command({type:"TAKE"})}>TAKE</button><button type="button" onClick={()=>command({type:"TAKE_OFF"})}>TAKE OFF</button><button type="button" onClick={()=>command({type:runtime.playing?"PAUSE":"PLAY"})}>{runtime.playing?"Pause":"Play"}</button></div>;
  return <div className={className} style={rootStyle} data-wegra-output={output.id} data-output-state={runtime.state} data-output-time={runtime.time}>{<div style={artboardStyle}><CanvasLayerStack layers={document.layers} selectedIds={new Set()} worlds3d={document.worlds3d??[]} views3d={document.views3d??[]} currentTime={runtime.time} onLayerPointerDown={()=>{}} onSelectLayer={()=>{}} onPathNodes={()=>{}} /></div>}{controls}</div>;
};

export function outputRenderPath(outputId:string){return `/render/${encodeURIComponent(outputId)}`}
