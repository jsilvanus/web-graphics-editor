import type { GraphicsDocument, SceneTimeline, AnimatedProperty } from "../types";
import type { DocumentOperation } from "../history/operations";
import { createKeyframe, createTrack, upsertKeyframe } from "../timeline";

export interface TimelineCommandResult { document: GraphicsDocument; operation?: DocumentOperation }
export function setTimelineCommand(document: GraphicsDocument, timeline: SceneTimeline | undefined): TimelineCommandResult { if (JSON.stringify(document.timeline) === JSON.stringify(timeline)) return { document }; return { document: { ...document, timeline }, operation: { type: "set-timeline", from: document.timeline, to: timeline } }; }
export function updateTimelineCommand(document: GraphicsDocument, updater: (timeline: SceneTimeline) => SceneTimeline, fallback: SceneTimeline): TimelineCommandResult { const current = document.timeline ?? fallback; return setTimelineCommand(document, updater(current)); }

/** Edit an already-animated property at an exact playhead time. It never implicitly enables animation. */
export function setAnimatedPropertyAtTime(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): TimelineCommandResult {
 const timeline=document.timeline;if(!timeline)return{document};const t=Math.max(0,time),track=timeline.tracks.find(item=>item.layerId===layerId&&item.property===property);if(!track)return{document};const existing=track.keyframes.find(k=>Math.abs(k.time-t)<=.0001);
 if(existing){if(Object.is(existing.value,value))return{document};const after={...existing,value},nextTrack={...track,keyframes:track.keyframes.map(k=>k.id===existing.id?after:k)},nextTimeline={...timeline,tracks:timeline.tracks.map(item=>item.id===track.id?nextTrack:item)};return{document:{...document,timeline:nextTimeline},operation:{type:"update-keyframe",trackId:track.id,keyframeId:existing.id,fromValue:existing.value,toValue:value}};}
 const keyframe=createKeyframe(t,value),nextTrack=upsertKeyframe(track,keyframe),nextTimeline={...timeline,tracks:timeline.tracks.map(item=>item.id===track.id?nextTrack:item)};return{document:{...document,timeline:nextTimeline},operation:{type:"add-keyframe",track,keyframe,createdTrack:false}};
}

/** Explicitly enable animation for a property, creating its first keyframe at the playhead. */
export function createAnimatedPropertyCommand(document: GraphicsDocument, layerId: string, property: AnimatedProperty, time: number, value: number): TimelineCommandResult {
 const timeline=document.timeline;if(!timeline)return{document};const track=createTrack(layerId,property),keyframe=createKeyframe(Math.max(0,time),value),nextTimeline={...timeline,tracks:[...timeline.tracks,{...track,keyframes:[keyframe]}]};return{document:{...document,timeline:nextTimeline},operation:{type:"add-keyframe",track,keyframe,createdTrack:true}};
}
