import { useEffect, useRef, useState } from "react";
import type { Layer, Graphics3DView, Graphics3DWorld } from "../../types";
import { ThreeGraphics3DRenderer } from "../../3d-renderer";
export interface ThreeDViewLayerProps { layer:Layer; view:Graphics3DView; world:Graphics3DWorld }
/** Renders a stored 3D camera view inside the ordinary 2D composition. */
export function ThreeDViewLayer({layer,view,world}:ThreeDViewLayerProps){
 const hostRef=useRef<HTMLDivElement>(null); const [cachedImage,setCachedImage]=useState<string|null>(null); const camera=world.cameras.find(item=>item.id===view.cameraId); const mode=view.renderMode??"auto"; const live=mode==="live"; const renderKey=JSON.stringify({world,view:{cameraId:view.cameraId,visibility:view.visibility},width:layer.width,height:layer.height});
 useEffect(()=>{if(!hostRef.current||!camera)return;const renderer=new ThreeGraphics3DRenderer();renderer.mount(hostRef.current);renderer.render(world,camera,view,{pixelRatio:Math.min(window.devicePixelRatio||1,2),width:Math.max(1,Math.round(layer.width)),height:Math.max(1,Math.round(layer.height))});const canvas=renderer.getCanvas();if(canvas&&!live){setCachedImage(canvas.toDataURL("image/png"));canvas.style.display="none";}return()=>renderer.dispose()},[renderKey,live,camera,view,world,layer.width,layer.height]);
 if(!camera)return null;
 return <div ref={hostRef} style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity:layer.style?.opacity??1}}>{!live&&cachedImage&&<img src={cachedImage} alt="" draggable={false} style={{width:"100%",height:"100%",objectFit:"fill",display:"block"}}/>}</div>;
}
