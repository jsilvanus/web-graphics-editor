import type { Layer } from "./types";

export interface SnapResult { x:number; y:number; snappedX:boolean; snappedY:boolean }
export interface SnapGuides { vertical:number[]; horizontal:number[] }
const DEFAULT_THRESHOLD=10;
const edges=(l:Layer)=>({left:l.x,centerX:l.x+l.width/2,right:l.x+l.width,top:l.y,centerY:l.y+l.height/2,bottom:l.y+l.height});
export function snapPosition(layer:Layer,layers:Layer[],canvasWidth:number,canvasHeight:number,dx:number,dy:number,threshold=DEFAULT_THRESHOLD):SnapResult{
 const others=layers.filter(l=>l.id!==layer.id);const x0=layer.x+dx,y0=layer.y+dy;const ex=edges({...layer,x:x0,y:y0});const xs=[0,canvasWidth,canvasWidth/2,...others.flatMap(l=>{const e=edges(l);return[e.left,e.centerX,e.right]})];const ys=[0,canvasHeight,canvasHeight/2,...others.flatMap(l=>{const e=edges(l);return[e.top,e.centerY,e.bottom]})];
 let bestX=x0,bestY=y0,bdX=threshold,bdY=threshold;for(const c of xs){for(const a of [ex.left,ex.centerX,ex.right]){const d=Math.abs(c-a);if(d<bdX){bdX=d;bestX=x0+(c-a)}}}for(const c of ys){for(const a of [ex.top,ex.centerY,ex.bottom]){const d=Math.abs(c-a);if(d<bdY){bdY=d;bestY=y0+(c-a)}}}return{x:bestX,y:bestY,snappedX:bdX<threshold,snappedY:bdY<threshold};
}
export function guidesForPosition(layer:Layer,layers:Layer[],canvasWidth:number,canvasHeight:number,threshold=DEFAULT_THRESHOLD):SnapGuides{
 const p=snapPosition(layer,layers,canvasWidth,canvasHeight,0,0,threshold),e=edges({...layer,x:p.x,y:p.y});const vertical:number[]=[],horizontal:number[]=[];for(const x of [0,canvasWidth,canvasWidth/2,...layers.filter(l=>l.id!==layer.id).flatMap(l=>{const a=edges(l);return[a.left,a.centerX,a.right]})])if(Math.abs(x-e.left)<1||Math.abs(x-e.centerX)<1||Math.abs(x-e.right)<1)vertical.push(x);for(const y of [0,canvasHeight,canvasHeight/2,...layers.filter(l=>l.id!==layer.id).flatMap(l=>{const a=edges(l);return[a.top,a.centerY,a.bottom]})])if(Math.abs(y-e.top)<1||Math.abs(y-e.centerY)<1||Math.abs(y-e.bottom)<1)horizontal.push(y);return{vertical:[...new Set(vertical)],horizontal:[...new Set(horizontal)]};
}
