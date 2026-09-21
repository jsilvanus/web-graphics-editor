import { useEffect, type FC } from "react";
import type { GraphicsAsset, Layer } from "../../types";
export const VideoProperties: FC<{layer:Layer;assets:GraphicsAsset[];onLayer:(patch:Partial<Layer>)=>void;onAsset?:(asset:GraphicsAsset)=>void}> = ({layer,assets,onLayer,onAsset}) => {
 const videos=assets.filter(a=>a.type==="video");
 const asset=videos.find(a=>a.id===layer.videoAssetId);
 const duration=typeof asset?.metadata?.duration==="number"?asset.metadata.duration:undefined;
 useEffect(()=>{ if(!asset||!onAsset||!asset.url||duration!==undefined)return; const video=document.createElement("video"); video.preload="metadata"; const done=()=>{if(Number.isFinite(video.duration)&&video.duration>0)onAsset({...asset,metadata:{...(asset.metadata??{}),duration:video.duration}});video.remove();}; video.addEventListener("loadedmetadata",done,{once:true}); video.src=asset.url; return()=>{video.removeEventListener("loadedmetadata",done);video.remove();}; },[asset?.id,asset?.url,duration,onAsset]);
 const max=duration;
 return <div className="ge-section"><b>Video</b>
  <label>Asset<select value={layer.videoAssetId ?? ""} onChange={e=>onLayer({videoAssetId:e.target.value||undefined})}><option value="">None</option>{videos.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  {duration!==undefined&&<div style={{fontSize:12,opacity:.7}}>Duration: {duration.toFixed(2)}s</div>}
  <label>Source in<input type="number" min="0" max={max} step=".1" value={layer.sourceIn ?? 0} onChange={e=>onLayer({sourceIn:Math.min(max??Infinity,Math.max(0,Number(e.target.value)||0))})}/></label>
  <label>Source out<input type="number" min={layer.sourceIn ?? 0} max={max} step=".1" value={layer.sourceOut ?? ""} onChange={e=>onLayer({sourceOut:e.target.value===""?undefined:Math.min(max??Infinity,Math.max(layer.sourceIn??0,Number(e.target.value)||0))})}/></label>
  <label>Time offset<input type="number" step=".1" value={layer.timeOffset ?? 0} onChange={e=>onLayer({timeOffset:Number(e.target.value)||0})}/></label>
  <label>Playback rate<input type="number" min="0.01" step=".1" value={layer.playbackRate ?? 1} onChange={e=>onLayer({playbackRate:Math.max(.01,Number(e.target.value)||1)})}/></label>
  <label><input type="checkbox" checked={layer.loop ?? false} onChange={e=>onLayer({loop:e.target.checked})}/> Loop</label>
 </div>; };