import type { AnimationKeyframe, AnimationValue, Graphics3DAnimatedProperty, Graphics3DWorld } from "./types";
import { upsert3DKeyframe } from "./3d-timeline";
const id = () => `3d-keyframe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export interface WorldEditResult { world: Graphics3DWorld; trackId: string; keyframeId: string; created: boolean }
export function editWorldPropertyAtTime(world: Graphics3DWorld,targetType:"mesh"|"camera",targetId:string,property:Graphics3DAnimatedProperty,time:number,value:AnimationValue):WorldEditResult {
 const tracks=world.timeline?.tracks??[]; const existing=tracks.find(t=>t.targetType===targetType&&t.targetId===targetId&&t.property===property); const trackId=existing?.id??`3d-track-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; const keyframe=existing?.keyframes.find(k=>Math.abs(k.time-time)<.0001); const k:AnimationKeyframe={id:keyframe?.id??id(),time:Math.max(0,time),value};
 const base=existing?world:{...world,timeline:{...(world.timeline??{}),tracks:[...tracks,{id:trackId,targetType,targetId,property,keyframes:[]}]}};
 const next=upsert3DKeyframe(base,trackId,k); return{world:next,trackId,keyframeId:k.id,created:!keyframe};
}
