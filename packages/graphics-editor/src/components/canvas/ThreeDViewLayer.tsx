import { useEffect, useState } from "react";
import type { Layer, Graphics3DView, Graphics3DWorld } from "../../types";
import { ThreeGraphics3DRenderer } from "../../3d-renderer";
import { create3DRenderCacheKey, get3DRenderCache, set3DRenderCache } from "../../3d-render-cache";

export interface ThreeDViewLayerProps { layer:Layer; view:Graphics3DView; world:Graphics3DWorld }

/** Renders a stored 3D camera view inside the ordinary 2D composition. */
export function ThreeDViewLayer({layer,view,world}:ThreeDViewLayerProps){
 const [cachedImage,setCachedImage]=useState<string|null>(null);
 const camera=world.cameras.find(item=>item.id===view.cameraId);
 const mode=view.renderMode??"auto";
 const live=mode==="live";
 const width=Math.max(1,Math.round(layer.width));
 const height=Math.max(1,Math.round(layer.height));
 const pixelRatio=Math.min(window.devicePixelRatio||1,2);
 const renderKey=camera?create3DRenderCacheKey(world,camera,view,width,height,pixelRatio):"";
 useEffect(()=>{
  if(!camera)return;
  if(live){
   const host=document.getElementById(`ge-3d-live-${layer.id}`);
   if(!host)return;
   const renderer=new ThreeGraphics3DRenderer();
   renderer.mount(host,false);
   renderer.render(world,camera,view,{pixelRatio,width,height});
   return()=>renderer.dispose();
  }
  const cached=get3DRenderCache(renderKey);
  if(cached){setCachedImage(cached.image);return;}
  const host=document.createElement("div");
  const renderer=new ThreeGraphics3DRenderer();
  renderer.mount(host,true);
  renderer.render(world,camera,view,{pixelRatio,width,height});
  const canvas=renderer.getCanvas();
  if(canvas){const image=canvas.toDataURL("image/png");set3DRenderCache(renderKey,image);setCachedImage(image);}
  renderer.dispose();
 },[renderKey,live,camera,view,world,width,height,layer.id,pixelRatio]);
 if(!camera)return null;
 if(!live)return <div style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity:layer.style?.opacity??1}}>{cachedImage&&<img src={cachedImage} alt="" draggable={false} style={{width:"100%",height:"100%",objectFit:"fill",display:"block"}}/>}</div>;
 return <div id={`ge-3d-live-${layer.id}`} style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity:layer.style?.opacity??1}}/>;
}
