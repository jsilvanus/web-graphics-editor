import { useEffect, useState } from "react";
import type { Layer, Graphics3DView, Graphics3DWorld } from "../../types";
import { ThreeGraphics3DRenderer } from "../../3d-renderer";
export interface ThreeDViewLayerProps { layer:Layer; view:Graphics3DView; world:Graphics3DWorld }
/** Renders a stored 3D camera view inside the ordinary 2D composition. */
export function ThreeDViewLayer({layer,view,world}:ThreeDViewLayerProps){
 const [cachedImage,setCachedImage]=useState<string|null>(null); const camera=world.cameras.find(item=>item.id===view.cameraId); const mode=view.renderMode??"auto"; const live=mode==="live"; const renderKey=JSON.stringify({world,view:{cameraId:view.cameraId,visibility:view.visibility},width:layer.width,height:layer.height});
 useEffect(()=>{if(!camera)return;const host=document.createElement("div");const renderer=new ThreeGraphics3DRenderer();renderer.mount(host,!live);renderer.render(world,camera,view,{pixelRatio:Math.min(window.devicePixelRatio||1,2),width:Math.max(1,Math.round(layer.width)),height:Math.max(1,Math.round(layer.height))});const canvas=renderer.getCanvas();if(!canvas)return;if(live){const target=document.getElementById(`ge-3d-live-${layer.id}`);if(target){target.replaceChildren(canvas);return()=>renderer.dispose();}renderer.dispose();return;}setCachedImage(canvas.toDataURL("image/png"));renderer.dispose();},[renderKey,live,camera,view,world,layer.width,layer.height,layer.id]);
 if(!camera)return null; if(!live)return <div style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity:layer.style?.opacity??1}}>{cachedImage&&<img src={cachedImage} alt="" draggable={false} style={{width:"100%",height:"100%",objectFit:"fill",display:"block"}}/>}</div>;
 return <div id={`ge-3d-live-${layer.id}`} style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity:layer.style?.opacity??1}}/>;
}
