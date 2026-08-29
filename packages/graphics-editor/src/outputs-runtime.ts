import type { GraphicsOutput, OutputTransition } from "./types";

export type OutputRuntimeState="off"|"entering"|"on"|"exiting";
export interface OutputRuntime{outputId:string;state:OutputRuntimeState;time:number;transitionTime:number;direction:"in"|"out"|null;updatedAt:number}
export type OutputRuntimeEvent={type:"TAKE"}|{type:"TAKE_OFF"}|{type:"TICK";delta:number}|{type:"SEEK";time:number}|{type:"RESET"};

const durationOf=(t:OutputTransition|undefined)=>Math.max(0,t?.duration??0);
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export function createOutputRuntime(output:GraphicsOutput):OutputRuntime{return{outputId:output.id,state:output.playback==="live"?"off":"on",time:output.defaultTime??0,transitionTime:0,direction:null,updatedAt:Date.now()}};
export function outputTransitionProgress(runtime:OutputRuntime,output:GraphicsOutput):number{const duration=durationOf(runtime.direction==="out"?output.outTransition:output.inTransition);if(!duration)return runtime.state==="exiting"?0:1;return clamp(runtime.transitionTime/duration,0,1)}
export function tickOutputRuntime(runtime:OutputRuntime,output:GraphicsOutput,delta:number):OutputRuntime{if(delta<=0)return runtime;let next={...runtime,updatedAt:Date.now()};if(runtime.state==="entering"){next.transitionTime+=delta;if(next.transitionTime>=durationOf(output.inTransition)){next.state="on";next.direction=null;next.transitionTime=0}}else if(runtime.state==="exiting"){next.transitionTime+=delta;if(next.transitionTime>=durationOf(output.outTransition)){next.state="off";next.direction=null;next.transitionTime=0}}if(output.playback==="automatic"||output.playback==="live"||output.playback==="user"){if(next.state==="on")next.time+=delta;if(output.loop&&output.duration&&output.duration>0)next.time=((next.time%output.duration)+output.duration)%output.duration}return next}
export function takeOutput(runtime:OutputRuntime,output:GraphicsOutput):OutputRuntime{if(!output.liveControl)return runtime;if(runtime.state==="on")return runtime;return{...runtime,state:durationOf(output.inTransition)>0?"entering":"on",direction:durationOf(output.inTransition)>0?"in":null,transitionTime:0,updatedAt:Date.now()}};
export function takeOffOutput(runtime:OutputRuntime,output:GraphicsOutput):OutputRuntime{if(!output.liveControl)return runtime;if(runtime.state==="off")return runtime;return{...runtime,state:durationOf(output.outTransition)>0?"exiting":"off",direction:durationOf(output.outTransition)>0?"out":null,transitionTime:0,updatedAt:Date.now()}};
export function seekOutput(runtime:OutputRuntime,time:number):OutputRuntime{return{...runtime,time:Math.max(0,time),updatedAt:Date.now()}};
export function resetOutput(runtime:OutputRuntime,output:GraphicsOutput):OutputRuntime{return createOutputRuntime(output)};
export function dispatchOutputRuntime(runtime:OutputRuntime,output:GraphicsOutput,event:OutputRuntimeEvent):OutputRuntime{switch(event.type){case"TAKE":return takeOutput(runtime,output);case"TAKE_OFF":return takeOffOutput(runtime,output);case"TICK":return tickOutputRuntime(runtime,output,event.delta);case"SEEK":return seekOutput(runtime,event.time);case"RESET":return resetOutput(runtime,output)}}
