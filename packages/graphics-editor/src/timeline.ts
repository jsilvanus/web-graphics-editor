export type AnimatedProperty = "x" | "y" | "width" | "height" | "rotation" | "opacity" | "scaleX" | "scaleY";
export type Easing = "linear" | "ease-in" | "ease-out" | "ease-in-out";
export interface Keyframe { id:string; time:number; value:number; easing?:Easing }
export interface Track { id:string; layerId:string; property:AnimatedProperty; keyframes:Keyframe[] }
export interface Scene { id:string; name:string; start:number; duration:number }
export interface SceneTimeline { scenes:Scene[]; currentSceneId:string; currentTime:number; tracks:Track[] }
export const DEFAULT_SCENE_DURATION=5;
export function createScene(name="Scene",start=0,duration=DEFAULT_SCENE_DURATION):Scene{return{id:`scene-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name,start,duration:Math.max(.1,duration)}}
export function createTrack(layerId:string,property:AnimatedProperty):Track{return{id:`track-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,layerId,property,keyframes:[]}}
export function createKeyframe(time:number,value:number,easing:Easing="linear"):Keyframe{return{id:`key-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,time,value,easing}}
export function timelineDuration(t:SceneTimeline){return t.scenes.reduce((m,s)=>Math.max(m,s.start+s.duration),0)}
export function normalizeScenes(scenes:Scene[]){let cursor=0;return scenes.map(s=>{const n={...s,start:cursor,duration:Math.max(.1,s.duration)};cursor+=n.duration;return n})}
export function addScene(t:SceneTimeline,name?:string):SceneTimeline{const start=timelineDuration(t),scene=createScene(name??`Scene ${t.scenes.length+1}`,start);return{...t,scenes:[...t.scenes,scene],currentSceneId:scene.id,currentTime:start}}
export function removeScene(t:SceneTimeline,id:string):SceneTimeline{if(t.scenes.length<=1)return t;const scenes=normalizeScenes(t.scenes.filter(s=>s.id!==id));const current=scenes.find(s=>s.id===t.currentSceneId)??scenes.at(-1)!;return{...t,scenes,currentSceneId:current.id,currentTime:current.start}}
export function setSceneDuration(t:SceneTimeline,id:string,duration:number):SceneTimeline{return{...t,scenes:normalizeScenes(t.scenes.map(s=>s.id===id?{...s,duration:Math.max(.1,duration)}:s))}}
export function sceneAtTime(t:SceneTimeline,time:number){return t.scenes.find(s=>time>=s.start&&time<s.start+s.duration)??t.scenes.at(-1)}
function ease(x:number,e:Easing="linear"){if(e==="ease-in")return x*x;if(e==="ease-out")return 1-(1-x)*(1-x);if(e==="ease-in-out")return x<.5?2*x*x:1-2*(1-x)*(1-x);return x}
export function interpolateKeyframes(k:Keyframe[],time:number){if(!k.length)return undefined;const a=[...k].sort((x,y)=>x.time-y.time);if(time<=a[0].time)return a[0].value;if(time>=a.at(-1)!.time)return a.at(-1)!.value;for(let i=1;i<a.length;i++){if(time<=a[i].time){const p=a[i-1],n=a[i],x=ease((time-p.time)/(n.time-p.time),n.easing);return p.value+(n.value-p.value)*x}}}
export function upsertKeyframe(t:Track,k:Keyframe):Track{return{...t,keyframes:[...t.keyframes.filter(x=>x.id!==k.id&&Math.abs(x.time-k.time)>.0001),k].sort((a,b)=>a.time-b.time)}}
export function moveKeyframe(t:Track,id:string,time:number):Track{const k=t.keyframes.find(x=>x.id===id);if(!k)return t;return upsertKeyframe(t,{...k,time:Math.max(0,time)})}
export function removeKeyframe(t:Track,id:string):Track{return{...t,keyframes:t.keyframes.filter(k=>k.id!==id)}}
