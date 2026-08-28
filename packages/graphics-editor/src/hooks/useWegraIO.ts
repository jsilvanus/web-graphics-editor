import { useCallback } from "react";
import { deserializeWegra, serializeWegra } from "../wegra";
import type { GraphicsDocument, SceneTimeline } from "../types";

export function useWegraIO(document:GraphicsDocument,timeline:SceneTimeline,history:unknown,resetHistory:(document:GraphicsDocument)=>void,setTimeline:React.Dispatch<React.SetStateAction<SceneTimeline>>,clear:()=>void){
 const saveWegra=useCallback(async()=>{try{const bytes=await serializeWegra({document:{...document,timeline},history,actors:{actors:{}}});const blob=new Blob([bytes],{type:"application/zip"});const url=URL.createObjectURL(blob);const a=window.document.createElement("a");a.href=url;a.download="graphics.wegra";a.click();setTimeout(()=>URL.revokeObjectURL(url),0)}catch(error){console.error("Failed to save .wegra",error);window.alert("Could not save this .wegra file.")}},[document,timeline,history]);
 const openWegra=useCallback(async(file:File)=>{try{const project=deserializeWegra(new Uint8Array(await file.arrayBuffer()));resetHistory(project.document);setTimeline(project.document.timeline??timeline);clear()}catch(error){console.error("Failed to open .wegra",error);window.alert("Could not open this .wegra file.")}},[resetHistory,setTimeline,clear,timeline]);
 return {saveWegra,openWegra};
}
