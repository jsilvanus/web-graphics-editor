import type { GraphicsDocument, GraphicsOutput, OutputBackgroundMode, OutputPlaybackMode, OutputTransition } from "./types";

const id=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const now=()=>new Date().toISOString();

export function createOutput(name="Output",compositionId?:string):GraphicsOutput{return{id:id("output"),name,compositionId,playback:"static",background:"transparent",editable:true,liveControl:true,defaultTime:0,createdAt:now(),updatedAt:now()}};
export function addOutput(document:GraphicsDocument,output?:GraphicsOutput):GraphicsDocument{return{...document,outputs:[...(document.outputs??[]),output??createOutput(`Output ${(document.outputs?.length??0)+1}`)]}};
export function updateOutput(document:GraphicsDocument,outputId:string,changes:Partial<Omit<GraphicsOutput,"id"|"createdAt">>):GraphicsDocument{return{...document,outputs:(document.outputs??[]).map(o=>o.id===outputId?{...o,...changes,updatedAt:now()}:o)}};
export function removeOutput(document:GraphicsDocument,outputId:string):GraphicsDocument{return{...document,outputs:(document.outputs??[]).filter(o=>o.id!==outputId)}};
export function setOutputPlayback(document:GraphicsDocument,outputId:string,playback:OutputPlaybackMode):GraphicsDocument{return updateOutput(document,outputId,{playback,autoplay:playback==="automatic"})};
export function setOutputBackground(document:GraphicsDocument,outputId:string,background:OutputBackgroundMode):GraphicsDocument{return updateOutput(document,outputId,{background})};
export function setOutputTransition(document:GraphicsDocument,outputId:string,direction:"in"|"out",transition?:OutputTransition):GraphicsDocument{const key=direction==="in"?"inTransition":"outTransition";return updateOutput(document,outputId,{[key]:transition} as Partial<GraphicsOutput>)}
export function findOutput(document:GraphicsDocument,outputId:string){return(document.outputs??[]).find(o=>o.id===outputId)}
export function outputCompositionId(output:GraphicsOutput){return output.compositionId}
