import { useCallback, useState } from "react";
import { createScene, timelineDuration } from "../timeline";
import type { SceneTimeline } from "../types";

export function createDefaultTimeline():SceneTimeline{const scene=createScene("Scene 1");return{scenes:[scene],currentSceneId:scene.id,currentTime:0,tracks:[],clips:[]};}
export function useGraphicsEditorTimeline(initial?:SceneTimeline){const [timeline,setTimeline]=useState<SceneTimeline>(initial??createDefaultTimeline);const seek=useCallback((time:number)=>setTimeline(t=>({...t,currentTime:Math.max(0,Math.min(timelineDuration(t),time))})),[]);const changeTimeline=useCallback((next:SceneTimeline)=>setTimeline(next),[]);return{timeline,setTimeline,seek,changeTimeline};}
