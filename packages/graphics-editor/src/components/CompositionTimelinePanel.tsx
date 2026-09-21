import { useState, type FC } from "react";
import type { AnimationTrack, Composition, Layer } from "../types";
import { TimelineKeyMarkers } from "./timeline/TimelineKeyMarkers";
import { TimelineTrackRow } from "./timeline/TimelineTrackRow";
import { TimelineKeyframeEditor } from "./timeline/TimelineKeyframeEditor";
import { moveKeyframe, removeKeyframe, createKeyframe } from "../timeline";
export const CompositionTimelinePanel: FC<{
 composition:Composition;
 layers:Layer[];
 compositions?:Composition[];
 assets?:{id:string;metadata?:Record<string,string|number>}[];
 currentTime:number;
 onSeek:(time:number)=>void;
 onChange:(composition:Composition)=>void;
 onLayerChange?:(layer:Layer)=>void;
}> = ({composition,layers,compositions=[],assets=[],currentTime,onSeek,onChange,onLayerChange}) => {
 const total=Math.max(1,composition.duration ?? 10);
 const [selected,setSelected]=useState<{trackId:string;keyId:string}|null>(null);
 const [selectedVideoId,setSelectedVideoId]=useState<string|null>(null);
 const tracks=composition.timeline?.tracks ?? [];
 const update=(next:AnimationTrack[])=>onChange({...composition,timeline:{tracks:next}});
 const updateInstance=(layer:Layer,patch:Partial<Layer>)=>onLayerChange?.({...layer,...patch});
 const updateVideo=(layer:Layer,patch:Partial<Layer>)=>onLayerChange?.({...layer,...patch});
 const add=(layer:Layer,property:string)=>{
   if(tracks.some(t=>t.targetId===layer.id&&t.property===property))return;
   const value=Number((layer as unknown as Record<string,unknown>)[property] ?? (property==="opacity"?layer.opacity:0))||0;
   update([...tracks,{id:"track-"+Date.now(),targetId:layer.id,property,keyframes:[createKeyframe(currentTime,value)]}]);
 };
 const videoDuration=(layer:Layer)=>{
   const asset=assets.find(a=>a.id===layer.videoAssetId);
   const duration=asset?.metadata?.duration;
   return typeof duration==="number"&&Number.isFinite(duration)&&duration>0?duration:undefined;
 };
 const seekFromClientX=(clientX:number,element:HTMLElement)=>{
   const rect=element.getBoundingClientRect();
   onSeek(Math.max(0,Math.min(total,(clientX-rect.left)/rect.width*total)));
 };
 const dragVideo=(layer:Layer,kind:"move"|"in"|"out",startX:number,bar:HTMLElement)=>{
   const initial={offset:Math.max(0,layer.timeOffset??0),sourceIn:Math.max(0,layer.sourceIn??0),sourceOut:layer.sourceOut};
   const duration=videoDuration(layer) ?? Math.max(initial.sourceOut??10,initial.sourceIn+0.01);
   const sourceSpan=Math.max(0,(initial.sourceOut??duration)-initial.sourceIn);
   const rate=layer.playbackRate&&layer.playbackRate>0?layer.playbackRate:1;
   const parentWidth=bar.getBoundingClientRect().width;
   const deltaTime=(x:number)=>((x-startX)/Math.max(1,parentWidth))*total;
   const apply=(x:number)=>{
     const delta=deltaTime(x);
     if(kind==="move"){
       const nextOffset=Math.max(0,Math.min(Math.max(0,total-sourceSpan/rate),initial.offset+delta));
       updateVideo(layer,{timeOffset:nextOffset});
     } else if(kind==="in"){
       const maxIn=Math.max(0,(initial.sourceOut??duration)-0.01);
       updateVideo(layer,{sourceIn:Math.max(0,Math.min(maxIn,initial.sourceIn+delta))});
     } else {
       const minOut=initial.sourceIn+0.01;
       updateVideo(layer,{sourceOut:Math.max(minOut,Math.min(duration,initial.sourceOut===undefined?duration:initial.sourceOut+delta))});
     }
   };
   const move=(event:PointerEvent)=>apply(event.clientX);
   const up=()=>{
     window.removeEventListener("pointermove",move);
     window.removeEventListener("pointerup",up);
   };
   window.addEventListener("pointermove",move);
   window.addEventListener("pointerup",up,{once:true});
 };
 return <section className="ge-timeline" aria-label="Composition timeline">
  <div className="ge-timeline-subhead">{composition.name} timeline · {currentTime.toFixed(2)}s / {total.toFixed(2)}s</div>
  <div className="ge-timeline-body" onPointerDown={e=>seekFromClientX(e.clientX,e.currentTarget)}>
   <div className="ge-track-list">{layers.filter(l=>l.type!=="group").map(layer=><div key={layer.id} className="ge-tree-object"><b>{layer.name??layer.text??layer.id}</b>{["x","y","width","height","rotation","opacity"].map(property=>{const t=tracks.find(x=>x.targetId===layer.id&&x.property===property);return <TimelineTrackRow key={property} label={property} keyframeCount={t?.keyframes.length??0} onAdd={()=>add(layer,property)}>{t&&<div className="ge-track-key-area"><TimelineKeyMarkers keyframes={t.keyframes} total={total} selectedKeyId={selected?.keyId} onSelect={keyId=>setSelected({trackId:t.id,keyId})} onMove={(keyId,time)=>update(tracks.map(x=>x.id===t.id?moveKeyframe(x,keyId,time):x))} onDelete={keyId=>update(tracks.map(x=>x.id===t.id?removeKeyframe(x,keyId):x))}/></div>}</TimelineTrackRow>})}</div>)}</div>
  </div>
  <div style={{marginTop:12}}><b>Video clips</b>
   {layers.filter(l=>l.type==="video"&&l.videoAssetId).map(layer=>{
     const selectedVideo=selectedVideoId===layer.id;
     const start=Math.max(0,layer.timeOffset??0);
     const sourceIn=Math.max(0,layer.sourceIn??0);
     const duration=videoDuration(layer);
     const rate=layer.playbackRate&&layer.playbackRate>0?layer.playbackRate:1;
     const effectiveOut=layer.sourceOut??duration;
     const sourceDuration=effectiveOut===undefined?10:Math.max(sourceIn,effectiveOut);
     const clipDuration=Math.max(0,sourceDuration-sourceIn)/rate;
     const width=Math.max(0,Math.min(total-start,clipDuration));
     const left=(start/total)*100;
     const widthPct=(width/total)*100;
     const barRef=(el:HTMLDivElement|null)=>{if(!el)return;};
     return <div key={layer.id} style={{marginTop:8}} onPointerDown={e=>e.stopPropagation()}>
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}>
        <b>{layer.name??layer.videoAssetId}</b><span>{start.toFixed(2)}s → {(start+width).toFixed(2)}s</span>
       </div>
       <div style={{position:"relative",height:20,marginTop:4,background:"rgba(127,127,127,.18)",borderRadius:3,cursor:"crosshair"}} onPointerDown={e=>{setSelectedVideoId(layer.id);seekFromClientX(e.clientX,e.currentTarget)}}>
        <div ref={barRef} style={{position:"absolute",left:left+"%",width:widthPct+"%",height:"100%",background:selectedVideo?"rgba(100,160,255,.75)":"rgba(100,160,255,.55)",borderRadius:3}}>
         <button aria-label="Trim video in" title="Trim in" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture?.(e.pointerId);dragVideo(layer,"in",e.clientX,e.currentTarget.parentElement?.parentElement as HTMLElement)}} style={{position:"absolute",left:-4,top:0,width:8,height:"100%",padding:0,border:0,cursor:"ew-resize",background:"transparent"}} />
         <button aria-label="Move video clip" title="Move clip" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture?.(e.pointerId);dragVideo(layer,"move",e.clientX,e.currentTarget.parentElement?.parentElement as HTMLElement)}} style={{position:"absolute",left:8,right:8,top:0,height:"100%",padding:0,border:0,cursor:"grab",background:"transparent"}} />
         <button aria-label="Trim video out" title="Trim out" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture?.(e.pointerId);dragVideo(layer,"out",e.clientX,e.currentTarget.parentElement?.parentElement as HTMLElement)}} style={{position:"absolute",right:-4,top:0,width:8,height:"100%",padding:0,border:0,cursor:"ew-resize",background:"transparent"}} />
        </div>
       </div>
       <div style={{display:"flex",gap:6,alignItems:"center",fontSize:11,marginTop:4,flexWrap:"wrap"}}>
        <label>offset <input type="number" step="0.1" value={start} onChange={e=>updateVideo(layer,{timeOffset:Math.max(0,Number(e.target.value)||0)})} style={{width:60}} /></label>
        <label>in <input type="number" min="0" step="0.1" max={duration} value={sourceIn} onChange={e=>updateVideo(layer,{sourceIn:Math.max(0,Math.min((layer.sourceOut??duration??Number.POSITIVE_INFINITY)-0.01,Number(e.target.value)||0))})} style={{width:55}} /></label>
        <label>out <input type="number" min={sourceIn+0.01} step="0.1" max={duration} value={layer.sourceOut??""} onChange={e=>updateVideo(layer,{sourceOut:e.target.value===""?undefined:Math.max(sourceIn+0.01,Math.min(duration??Number.POSITIVE_INFINITY,Number(e.target.value)||0))})} style={{width:55}} /></label>
        <label>rate <input type="number" min="0.01" step="0.05" value={rate} onChange={e=>updateVideo(layer,{playbackRate:Math.max(0.01,Number(e.target.value)||1)})} style={{width:55}} /></label>
       </div>
     </div>;
   })}
  </div>
  <div style={{marginTop:12}}><b>Composition instances</b>{layers.filter(l=>l.type==="composition"&&l.compositionId).map(layer=>{const start=Math.max(0,layer.timeOffset??0);const rate=layer.playbackRate&&layer.playbackRate>0?layer.playbackRate:1;const sourceIn=layer.compositionIn??0;const sourceOut=layer.compositionOut;const referenced=compositions.find(c=>c.id===layer.compositionId);const sourceDuration=sourceOut??referenced?.duration??10;const duration=Math.max(0,sourceDuration-sourceIn)/rate;const width=Math.max(0,Math.min(total-start,duration));return <div key={layer.id} style={{marginTop:8}}><b>{layer.name??layer.compositionId}</b><div style={{display:"flex",gap:6,alignItems:"center",fontSize:11,marginTop:4,flexWrap:"wrap"}}><label>offset <input type="number" step="0.1" value={start} onChange={e=>updateInstance(layer,{timeOffset:Math.max(0,Number(e.target.value)||0)})} style={{width:60}} /></label><label>rate <input type="number" min="0.01" step="0.05" value={rate} onChange={e=>updateInstance(layer,{playbackRate:Math.max(0.01,Number(e.target.value)||1)})} style={{width:55}} /></label><label>in <input type="number" min="0" step="0.1" value={sourceIn} onChange={e=>updateInstance(layer,{compositionIn:Math.max(0,Number(e.target.value)||0)})} style={{width:55}} /></label><label>out <input type="number" min="0" step="0.1" value={sourceOut??""} onChange={e=>updateInstance(layer,{compositionOut:e.target.value===""?undefined:Math.max(sourceIn,Number(e.target.value)||0)})} style={{width:55}} /></label><label><input type="checkbox" checked={!!layer.loop} onChange={e=>updateInstance(layer,{loop:e.target.checked})}/> loop</label></div><div style={{position:"relative",height:16,marginTop:4,background:"rgba(127,127,127,.18)",borderRadius:3}}><div style={{position:"absolute",left:(start/total)*100+"%",width:(width/total)*100+"%",height:"100%",background:"rgba(100,160,255,.55)",borderRadius:3}} /></div></div>})}</div>
  {selected&&(()=>{const t=tracks.find(x=>x.id===selected.trackId);const k=t?.keyframes.find(x=>x.id===selected.keyId);return t&&k?<TimelineKeyframeEditor value={k} onTimeChange={time=>update(tracks.map(x=>x.id===t.id?moveKeyframe(x,k.id,time):x))} onValueChange={value=>update(tracks.map(x=>x.id===t.id?{...x,keyframes:x.keyframes.map(y=>y.id===k.id?{...y,value}:y)}:x))} onEasingChange={easing=>update(tracks.map(x=>x.id===t.id?{...x,keyframes:x.keyframes.map(y=>y.id===k.id?{...y,interpolation:easing}:y)}:x))} onDelete={()=>update(tracks.map(x=>x.id===t.id?removeKeyframe(x,k.id):x))}/>:null})()}
 </section>;
};