import type { Graphics3DCamera, Graphics3DView, Graphics3DWorld } from "./types";
export interface Graphics3DRenderCacheEntry{key:string;image:string;createdAt:number}
const cache=new Map<string,Graphics3DRenderCacheEntry>();
function stable(value:unknown):string{return JSON.stringify(value,(key,val)=>{if(val&&typeof val==="object"&&!Array.isArray(val))return Object.keys(val as Record<string,unknown>).sort().reduce((out,k)=>{out[k]=(val as Record<string,unknown>)[k];return out},{} as Record<string,unknown>);return val;});}
export function create3DRenderCacheKey(world:Graphics3DWorld,camera:Graphics3DCamera,view:Graphics3DView,width:number,height:number,pixelRatio:number):string{return stable({world,camera,visibility:view.visibility,renderSettings:view.renderSettings,width,height,pixelRatio});}
export function get3DRenderCache(key:string):Graphics3DRenderCacheEntry|undefined{return cache.get(key)}
export function set3DRenderCache(key:string,image:string):Graphics3DRenderCacheEntry{const entry={key,image,createdAt:Date.now()};cache.set(key,entry);return entry}
export function clear3DRenderCache():void{cache.clear()}
export function invalidate3DRenderCache(prefix?:string):void{if(!prefix){cache.clear();return}for(const key of cache.keys())if(key.startsWith(prefix))cache.delete(key)}
