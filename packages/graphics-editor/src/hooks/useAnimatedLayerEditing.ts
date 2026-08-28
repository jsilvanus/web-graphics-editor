import { useCallback } from "react";
import type { Layer } from "../types";
import type { AnimatedProperty } from "../timeline";
import { createKeyframe, createTrack, upsertKeyframe } from "../timeline";

export const ANIMATED_PROPERTIES:AnimatedProperty[]=["x","y","width","height","rotation","opacity"];

export function useAnimatedLayerEditing(
 updateLayer:(id:string,patch:Partial<Layer>)=>void,
 updateStyle:(id:string,key:string,value:string|number)=>void,
 setTimeline:React.Dispatch<React.SetStateAction<import("../types").SceneTimeline>>,
 currentTime:number,
){
 const ensureTrackAndKey=useCallback((id:string,property:AnimatedProperty,value:number)=>setTimeline(t=>{const existing=t.tracks.find(x=>x.layerId===id&&x.property===property);const track=existing??createTrack(id,property);const nextTrack=upsertKeyframe(track,createKeyframe(t.currentTime,value));return{...t,tracks:existing?t.tracks.map(x=>x.id===track.id?nextTrack:x):[...t.tracks,nextTrack]}}),[setTimeline]);
 const changeLayer=useCallback((id:string,patch:Partial<Layer>)=>{updateLayer(id,patch);for(const[property,value]of Object.entries(patch)){if(!ANIMATED_PROPERTIES.includes(property as AnimatedProperty))continue;const n=Number(value);if(Number.isFinite(n))ensureTrackAndKey(id,property as AnimatedProperty,n)}},[updateLayer,ensureTrackAndKey]);
 const changeStyle=useCallback((id:string,key:string,value:string|number)=>{updateStyle(id,key,value);if(key==="opacity"){const n=Number(value);if(Number.isFinite(n))ensureTrackAndKey(id,"opacity",n)}},[updateStyle,ensureTrackAndKey]);
 return {changeLayer,changeStyle,ensureTrackAndKey};
}
