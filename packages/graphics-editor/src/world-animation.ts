import type { AnimationValue, Graphics3DWorld, Graphics3DTrack, Graphics3DMesh, Graphics3DCamera } from "./types";
import { mapWorldTime } from "./world-time";
import { interpolateAnimationKeyframes } from "./timeline";
export interface Evaluated3DWorld { worldTime:number; meshes:Graphics3DMesh[]; cameras:Graphics3DCamera[] }
function tracks(world:Graphics3DWorld):Graphics3DTrack[]{return world.timeline?.tracks??[]}
export function evaluateWorldAtTime(world:Graphics3DWorld,wegraTime:number,mapping:Parameters<typeof mapWorldTime>[1]):Evaluated3DWorld{
 const worldTime=mapWorldTime(wegraTime,mapping);
 let meshes=world.meshes.map(m=>({...m,transform:{...m.transform,position:[...m.transform.position] as [number,number,number],rotation:[...m.transform.rotation] as [number,number,number],scale:[...m.transform.scale] as [number,number,number]},material:m.material?{...m.material}:undefined}));
 let cameras=world.cameras.map(c=>({...c,position:[...c.position] as [number,number,number],rotation:[...c.rotation] as [number,number,number]}));
 for(const track of tracks(world)){const value=interpolateAnimationKeyframes(track.keyframes,worldTime);if(value===undefined)continue;if(track.targetType==="mesh")meshes=meshes.map(m=>m.id===track.targetId?applyMeshTrack(m,track.property,value):m);if(track.targetType==="camera")cameras=cameras.map(c=>c.id===track.targetId?applyCameraTrack(c,track.property,value):c)}
 return{worldTime,meshes,cameras}
}
function numberValue(v:AnimationValue):number|undefined{return typeof v==="number"?v:undefined}
function applyMeshTrack(mesh:Graphics3DMesh,property:Graphics3DTrack["property"],value:AnimationValue):Graphics3DMesh{
 const n=numberValue(value),t={...mesh.transform,position:[...mesh.transform.position] as [number,number,number],rotation:[...mesh.transform.rotation] as [number,number,number],scale:[...mesh.transform.scale] as [number,number,number]};
 if(n!==undefined){if(property==="positionX")t.position[0]=n;else if(property==="positionY")t.position[1]=n;else if(property==="positionZ")t.position[2]=n;else if(property==="rotationX")t.rotation[0]=n;else if(property==="rotationY")t.rotation[1]=n;else if(property==="rotationZ")t.rotation[2]=n;else if(property==="scaleX")t.scale[0]=n;else if(property==="scaleY")t.scale[1]=n;else if(property==="scaleZ")t.scale[2]=n;}
 if(property==="opacity"&&n!==undefined)return{...mesh,transform:t,opacity:n};
 if(property==="materialOpacity"&&n!==undefined)return{...mesh,transform:t,material:{...(mesh.material??{}),opacity:n}};
 if(property==="materialColor"&&typeof value==="string")return{...mesh,transform:t,material:{...(mesh.material??{}),color:value}};
 if(property==="visibility"&&typeof value==="boolean")return{...mesh,transform:t,visible:value} as Graphics3DMesh;
 return{...mesh,transform:t}
}
function applyCameraTrack(camera:Graphics3DCamera,property:Graphics3DTrack["property"],value:AnimationValue):Graphics3DCamera{const n=numberValue(value);const c={...camera,position:[...camera.position] as [number,number,number],rotation:[...camera.rotation] as [number,number,number]};if(n===undefined)return c;if(property==="positionX")c.position[0]=n;else if(property==="positionY")c.position[1]=n;else if(property==="positionZ")c.position[2]=n;else if(property==="rotationX")c.rotation[0]=n;else if(property==="rotationY")c.rotation[1]=n;else if(property==="rotationZ")c.rotation[2]=n;else if(property==="fov")c.fov=n;return c}
