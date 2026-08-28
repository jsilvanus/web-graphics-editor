import type { FC } from "react";
import type { Scene, SceneTimeline } from "../timeline";
import { timelineDuration } from "../timeline";
export const SceneTimelinePanel: FC<{ timeline: SceneTimeline; onChange:(timeline:SceneTimeline)=>void }> = ({ timeline, onChange }) => {
  const total = Math.max(1, timelineDuration(timeline)); const current = timeline.currentTime;
  const selectScene = (scene:Scene) => onChange({ ...timeline, currentSceneId:scene.id, currentTime:scene.start });
  return <section className="ge-timeline" aria-label="Scene timeline">
    <div className="ge-timeline-head"><b>Scenes</b><button onClick={()=>{const n=timeline.scenes.length+1; const start=total; const scene={id:`scene-${Date.now()}`,name:`Scene ${n}`,start,duration:5}; onChange({...timeline,scenes:[...timeline.scenes,scene],currentSceneId:scene.id,currentTime:start});}}>＋ Scene</button></div>
    <div className="ge-timeline-ruler" style={{gridTemplateColumns:`repeat(${Math.max(1,Math.ceil(total))},1fr)`}}>{Array.from({length:Math.ceil(total)+1},(_,i)=><span key={i}>{i}s</span>)}</div>
    <div className="ge-timeline-body">{timeline.scenes.map(scene=><button key={scene.id} className={scene.id===timeline.currentSceneId?"ge-scene ge-scene-active":"ge-scene"} onClick={()=>selectScene(scene)} style={{left:`${scene.start/total*100}%`,width:`${scene.duration/total*100}%`}} title={`${scene.name}: ${scene.duration.toFixed(1)}s`}><span>{scene.name}</span><small>{scene.duration.toFixed(1)}s</small></button>)}</div>
    <div className="ge-playhead" style={{left:`${Math.min(100,current/total*100)}%`}} />
    <div className="ge-timeline-controls">{timeline.scenes.map(scene=><label key={scene.id}>{scene.name}<input type="number" min="0.1" step="0.1" value={scene.duration} onChange={e=>{const duration=Math.max(.1,Number(e.target.value)||.1); let cursor=0; const scenes=timeline.scenes.map(s=>{const next={...s,start:cursor,duration:s.id===scene.id?duration:s.duration};cursor+=next.duration;return next}); onChange({...timeline,scenes})}}/> s</label>)}</div>
  </section>;
};
