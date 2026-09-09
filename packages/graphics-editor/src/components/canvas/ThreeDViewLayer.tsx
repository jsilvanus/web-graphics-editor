import { useEffect, useRef, useState } from "react";
import type { Layer, Graphics3DView, Graphics3DWorld } from "../../types";
import { ThreeGraphics3DRenderer } from "../../3d-renderer";
import { create3DRenderCacheKey, get3DRenderCache, set3DRenderCache } from "../../3d-render-cache";
import { get3DOutputSize } from "../../3d-render-resolution";
import { evaluateWorldAtTime } from "../../world-animation";

export interface ThreeDViewLayerProps{layer:Layer;view:Graphics3DView;world:Graphics3DWorld;currentTime:number}

export function ThreeDViewLayer({layer,view,world,currentTime}:ThreeDViewLayerProps){
 const[cachedImage,setCachedImage]=useState<string|null>(null);
 const hostRef=useRef<HTMLDivElement|null>(null);
 const rendererRef=useRef<ThreeGraphics3DRenderer|null>(null);
 const mappedWorld=evaluateWorldAtTime(world,currentTime,view.worldTime??{offset:0,rate:1});
 const camera=mappedWorld.cameras.find(item=>item.id===view.cameraId);
 const mode=view.renderMode??"auto";const live=mode==="live";const settings=view.renderSettings??{};const output=get3DOutputSize(layer.width,layer.height,settings);const basePixelRatio=Math.min(window.devicePixelRatio||1,settings.maxPixelRatio??2);const pixelRatio=Math.max(.25,basePixelRatio);
 const renderOptions={pixelRatio,width:output.width,height:output.height,background:settings.background,backgroundOpacity:settings.backgroundOpacity,shadows:settings.shadows,environmentColor:settings.environmentColor,environmentIntensity:settings.environmentIntensity};
 const renderWorld={...world,meshes:mappedWorld.meshes,cameras:mappedWorld.cameras,lights:mappedWorld.lights};
 const renderKey=camera?`${create3DRenderCacheKey(renderWorld,camera,view,output.width,output.height,pixelRatio)}@${mappedWorld.worldTime}`:"";
 useEffect(()=>{if(!live||!camera)return;const host=hostRef.current;if(!host)return;const renderer=new ThreeGraphics3DRenderer();renderer.mount(host,false);rendererRef.current=renderer;return()=>{renderer.dispose();rendererRef.current=null}},[live,camera?.id,layer.id]);
 useEffect(()=>{if(!camera)return;if(live){rendererRef.current?.render(renderWorld,camera,view,renderOptions);return}const cached=get3DRenderCache(renderKey);if(cached){setCachedImage(cached.image);return}const host=document.createElement("div"),renderer=new ThreeGraphics3DRenderer();renderer.mount(host,true);renderer.render(renderWorld,camera,view,renderOptions);const canvas=renderer.getCanvas();if(canvas){const image=canvas.toDataURL("image/png");set3DRenderCache(renderKey,image);setCachedImage(image)}renderer.dispose()},[renderKey,live,camera,currentTime,view,renderWorld,output.width,output.height,pixelRatio,settings.background,settings.backgroundOpacity,settings.shadows,settings.environmentColor,settings.environmentIntensity]);
 if(!camera)return null;const opacity=Math.max(0,Math.min(1,Number(layer.style?.opacity??1)));const style:React.CSSProperties={width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none",opacity};return <div ref={hostRef} id={`ge-3d-live-${layer.id}`} style={style}>{!live&&cachedImage&&<img src={cachedImage} alt="" draggable={false} style={{width:"100%",height:"100%",objectFit:"fill",display:"block"}}/>}</div>;
}
