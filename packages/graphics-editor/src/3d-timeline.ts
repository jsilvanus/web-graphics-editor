import type { Graphics3DAnimatedProperty, Graphics3DAnimationTarget, Graphics3DTrack, Graphics3DWorld, Keyframe } from "./types";

const id=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export function add3DTrack(world:Graphics3DWorld,targetType:Graphics3DAnimationTarget,targetId:string,property:Graphics3DAnimatedProperty):Graphics3DWorld{
  const track:Graphics3DTrack={id:id("3d-track"),targetType,targetId,property,keyframes:[]};
  return {...world,timeline:{tracks:[...(world.timeline?.tracks??[]),track]}};
}
export function remove3DTrack(world:Graphics3DWorld,trackId:string):Graphics3DWorld{return{...world,timeline:{tracks:(world.timeline?.tracks??[]).filter(track=>track.id!==trackId)}}}
export function upsert3DKeyframe(world:Graphics3DWorld,trackId:string,keyframe:Keyframe):Graphics3DWorld{return{...world,timeline:{tracks:(world.timeline?.tracks??[]).map(track=>track.id!==trackId?track:{...track,keyframes:[...track.keyframes.filter(k=>k.id!==keyframe.id&&Math.abs(k.time-keyframe.time)>.0001),keyframe].sort((a,b)=>a.time-b.time)})}}}
export function remove3DKeyframe(world:Graphics3DWorld,trackId:string,keyframeId:string):Graphics3DWorld{return{...world,timeline:{tracks:(world.timeline?.tracks??[]).map(track=>track.id===trackId?{...track,keyframes:track.keyframes.filter(k=>k.id!==keyframeId)}:track)}}}
export function move3DKeyframe(world:Graphics3DWorld,trackId:string,keyframeId:string,time:number):Graphics3DWorld{const track=(world.timeline?.tracks??[]).find(t=>t.id===trackId),key=track?.keyframes.find(k=>k.id===keyframeId);return key?upsert3DKeyframe(world,trackId,{...key,time:Math.max(0,time)}):world}
export function tracks3DForTarget(world:Graphics3DWorld|undefined,targetType:Graphics3DAnimationTarget,targetId:string):Graphics3DTrack[]{return(world?.timeline?.tracks??[]).filter(t=>t.targetType===targetType&&t.targetId===targetId)}
