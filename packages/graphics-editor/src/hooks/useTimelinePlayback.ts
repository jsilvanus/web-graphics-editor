import { useEffect, useRef } from "react";
import { timelineDuration } from "../timeline";
import type { SceneTimeline } from "../types";

export function useTimelinePlayback(playing:boolean,setPlaying:(v:boolean)=>void,setTimeline:React.Dispatch<React.SetStateAction<SceneTimeline>>,timeline:SceneTimeline){
 const frame=useRef<number|null>(null);
 const playingRef=useRef(playing);
 playingRef.current=playing;
 useEffect(()=>{if(!playing){if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;return}let last:number|null=null;const tick=(now:number)=>{if(!playingRef.current)return;const dt=last===null?0:(now-last)/1000;last=now;let shouldContinue=true;setTimeline(t=>{const total=timelineDuration(t),next=t.currentTime+dt;if(next>=total){if(t.loop)return {...t,currentTime:total>0?next%total:0};shouldContinue=false;return {...t,currentTime:total}}return {...t,currentTime:next}});if(shouldContinue)frame.current=requestAnimationFrame(tick);else{frame.current=null;setPlaying(false)}};frame.current=requestAnimationFrame(tick);return()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null}},[playing,setPlaying,setTimeline]);
}
