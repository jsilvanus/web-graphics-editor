import type { Graphics3DRenderSettings } from "./types";

export interface Graphics3DOutputSize { width:number; height:number }

/**
 * Determines the actual render target size. Auto follows the 2D view's canvas
 * bounds; custom allows a deliberately different render resolution while the
 * resulting image is still composited into the same layer rectangle.
 */
export function get3DOutputSize(layerWidth:number,layerHeight:number,settings?:Graphics3DRenderSettings):Graphics3DOutputSize {
  const mode=settings?.resolutionMode??"auto";
  const scale=Math.max(0.1,settings?.resolutionScale??1);
  if(mode==="custom") {
    return {
      width:Math.max(1,Math.round(settings?.resolutionWidth??layerWidth*scale)),
      height:Math.max(1,Math.round(settings?.resolutionHeight??layerHeight*scale)),
    };
  }
  return {width:Math.max(1,Math.round(layerWidth*scale)),height:Math.max(1,Math.round(layerHeight*scale))};
}
