import { useEffect, useRef } from "react";
import { timelineDuration } from "../timeline";
import type { SceneTimeline } from "../types";

export function useTimelinePlayback(playing:boolean,setPlaying:(v:boolean)=>void,setTimeline:React.Dispatch<React.SetStateAction<SceneTimeline>>,timeline:SceneTimeline){
 const last=useRef<number|null>(null);
 useEffect(()=>{if(!playing)return;const tick=(now:number)=>{const previous=last.current??now;const dt=(now-previous)/1000;last.current=now;setTimeline(t=>{const total=timelineDuration(t),next=t.currentTime+dt;if(next>=total){if(t.loop)return {...t,currentTime:total>0?next%total:0};return {...t,currentTime:total}}return {...t,currentTime:next}});const total=timelineDuration(timeline);if(timeline.loop||timeline.currentTime+dt<total)requestAnimationFrame(tick);else setPlaying(false)};const id=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(id);last.current=null}},[playing,setPlaying,setTimeline,timeline.loop,timeline.currentTime,timeline.scenes]);
}
