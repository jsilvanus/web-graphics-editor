import type { Graphics3DAnimatedProperty, Graphics3DAnimationTarget, Graphics3DTrack, Keyframe, SceneTimeline } from "./types";

const id=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export function add3DTrack(timeline:SceneTimeline, targetType:Graphics3DAnimationTarget, targetId:string, property:Graphics3DAnimatedProperty):SceneTimeline{
  const track:Graphics3DTrack={id:id("3d-track"),targetType,targetId,property,keyframes:[]};
  return {...timeline,tracks3d:[...(timeline.tracks3d??[]),track]};
}

export function remove3DTrack(timeline:SceneTimeline, trackId:string):SceneTimeline{
  return {...timeline,tracks3d:(timeline.tracks3d??[]).filter(track=>track.id!==trackId)};
}

export function upsert3DKeyframe(timeline:SceneTimeline,trackId:string,keyframe:Keyframe):SceneTimeline{
  return {...timeline,tracks3d:(timeline.tracks3d??[]).map(track=>track.id!==trackId?track:{...track,keyframes:[...track.keyframes.filter(k=>k.id!==keyframe.id&&Math.abs(k.time-keyframe.time)>.0001),keyframe].sort((a,b)=>a.time-b.time)})};
}

export function remove3DKeyframe(timeline:SceneTimeline,trackId:string,keyframeId:string):SceneTimeline{
  return {...timeline,tracks3d:(timeline.tracks3d??[]).map(track=>track.id===trackId?{...track,keyframes:track.keyframes.filter(k=>k.id!==keyframeId)}:track)};
}

export function move3DKeyframe(timeline:SceneTimeline,trackId:string,keyframeId:string,time:number):SceneTimeline{
  const track=(timeline.tracks3d??[]).find(t=>t.id===trackId),key=track?.keyframes.find(k=>k.id===keyframeId);
  return key?upsert3DKeyframe(timeline,trackId,{...key,time:Math.max(0,time)}):timeline;
}

export function tracks3DForTarget(timeline:SceneTimeline|undefined,targetType:Graphics3DAnimationTarget,targetId:string):Graphics3DTrack[]{return (timeline?.tracks3d??[]).filter(t=>t.targetType===targetType&&t.targetId===targetId);}
