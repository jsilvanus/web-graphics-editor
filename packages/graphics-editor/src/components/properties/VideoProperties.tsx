import type { FC } from "react";
import type { GraphicsAsset, Layer } from "../../types";
export const VideoProperties: FC<{layer:Layer;assets:GraphicsAsset[];onLayer:(patch:Partial<Layer>)=>void}> = ({layer,assets,onLayer}) => {
 const videos=assets.filter(a=>a.type==="video");
 return <div className="ge-section"><b>Video</b>
  <label>Asset<select value={layer.videoAssetId ?? ""} onChange={e=>onLayer({videoAssetId:e.target.value||undefined})}><option value="">None</option>{videos.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  <label>Source in<input type="number" min="0" step=".1" value={layer.sourceIn ?? 0} onChange={e=>onLayer({sourceIn:Math.max(0,Number(e.target.value)||0)})}/></label>
  <label>Source out<input type="number" min="0" step=".1" value={layer.sourceOut ?? ""} onChange={e=>onLayer({sourceOut:e.target.value===""?undefined:Math.max(0,Number(e.target.value)||0)})}/></label>
  <label>Time offset<input type="number" step=".1" value={layer.timeOffset ?? 0} onChange={e=>onLayer({timeOffset:Number(e.target.value)||0})}/></label>
  <label>Playback rate<input type="number" min="0" step=".1" value={layer.playbackRate ?? 1} onChange={e=>onLayer({playbackRate:Math.max(0,Number(e.target.value)||0)})}/></label>
  <label><input type="checkbox" checked={layer.loop ?? false} onChange={e=>onLayer({loop:e.target.checked})}/> Loop</label>
 </div>; };