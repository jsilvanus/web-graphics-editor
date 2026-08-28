export type AnimatedProperty = "x" | "y" | "width" | "height" | "rotation" | "opacity" | "scaleX" | "scaleY";
export interface Keyframe { id: string; time: number; value: number; easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out"; }
export interface Track { id: string; layerId: string; property: AnimatedProperty; keyframes: Keyframe[]; }
export interface Scene { id: string; name: string; start: number; duration: number; }
export interface SceneTimeline { scenes: Scene[]; currentSceneId: string; currentTime: number; tracks: Track[]; }
export const DEFAULT_SCENE_DURATION = 5;
export function createScene(name = "Scene", start = 0, duration = DEFAULT_SCENE_DURATION): Scene { return { id:`scene-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name,start,duration:Math.max(.1,duration) }; }
export function createTrack(layerId:string, property:AnimatedProperty):Track { return {id:`track-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,layerId,property,keyframes:[]}; }
export function createKeyframe(time:number,value:number,easing:Keyframe["easing"]="linear"):Keyframe { return {id:`key-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,time,value,easing}; }
export function timelineDuration(timeline:SceneTimeline):number{return timeline.scenes.reduce((max,s)=>Math.max(max,s.start+s.duration),0);}
export function normalizeScenes(scenes:Scene[]):Scene[]{let cursor=0;return scenes.map(s=>{const next={...s,start:cursor,duration:Math.max(.1,s.duration)};cursor+=next.duration;return next;});}
export function addScene(timeline:SceneTimeline,name?:string):SceneTimeline{const start=timelineDuration(timeline),scene=createScene(name??`Scene ${timeline.scenes.length+1}`,start);return {...timeline,scenes:[...timeline.scenes,scene],currentSceneId:scene.id,currentTime:start};}
export function removeScene(timeline:SceneTimeline,id:string):SceneTimeline{if(timeline.scenes.length<=1)return timeline;const scenes=normalizeScenes(timeline.scenes.filter(s=>s.id!==id));const current=scenes.find(s=>s.id===timeline.currentSceneId)??scenes.at(-1)!;return {...timeline,scenes,currentSceneId:current.id,currentTime:current.start};}
export function setSceneDuration(timeline:SceneTimeline,id:string,duration:number):SceneTimeline{return {...timeline,scenes:normalizeScenes(timeline.scenes.map(s=>s.id===id?{...s,duration:Math.max(.1,duration)}:s))};}
export function sceneAtTime(timeline:SceneTimeline,time:number):Scene|undefined{return timeline.scenes.find(s=>time>=s.start&&time<s.start+s.duration)??timeline.scenes.at(-1);}
function ease(t:number,easing:Keyframe["easing"]="linear"){if(easing==="ease-in")return t*t;if(easing==="ease-out")return 1-(1-t)*(1-t);if(easing==="ease-in-out")return t<.5?2*t*t:1-2*(1-t)*(1-t);return t;}
export function interpolateKeyframes(keyframes:Keyframe[],time:number):number|undefined{if(!keyframes.length)return undefined;const k=[...keyframes].sort((a,b)=>a.time-b.time);if(time<=k[0].time)return k[0].value;if(time>=k.at(-1)!.time)return k.at(-1)!.value;for(let i=1;i<k.length;i++){if(time<=k[i].time){const a=k[i-1],b=k[i],t=ease((time-a.time)/(b.time-a.time),b.easing);return a.value+(b.value-a.value)*t;}}return undefined;}
export function upsertKeyframe(track:Track,keyframe:Keyframe):Track{return {...track,keyframes:[...track.keyframes.filter(k=>Math.abs(k.time-keyframe.time)>0.0001),keyframe].sort((a,b)=>a.time-b.time)};}
export function removeKeyframe(track:Track,id:string):Track{return {...track,keyframes:track.keyframes.filter(k=>k.id!==id)};}
