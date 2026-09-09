import type { AnimationKeyframe, AnimationValue, Graphics3DWorld, Graphics3DTrack, Graphics3DMesh, Graphics3DCamera, Graphics3DLight } from "./types";
import { mapWorldTime } from "./world-time";
import { evaluateAnimationKeyframes } from "./animation";

export interface Evaluated3DWorld { worldTime:number; meshes:Graphics3DMesh[]; cameras:Graphics3DCamera[]; lights:Graphics3DLight[] }
function tracks(world:Graphics3DWorld):Graphics3DTrack[]{return world.timeline?.tracks??[]}

/** Evaluate a reusable 3D world at a WEGRA/main-timeline time. Each view may supply its own mapping. */
export function evaluateWorldAtTime(world:Graphics3DWorld,wegraTime:number,mapping:Parameters<typeof mapWorldTime>[1]):Evaluated3DWorld{
 const worldTime=mapWorldTime(wegraTime,mapping);
 let meshes=world.meshes.map(m=>({...m,transform:{...m.transform,position:[...m.transform.position] as [number,number,number],rotation:[...m.transform.rotation] as [number,number,number],scale:[...m.transform.scale] as [number,number,number]},material:m.material?{...m.material}:undefined}));
 let cameras=world.cameras.map(c=>({...c,position:[...c.position] as [number,number,number],rotation:[...c.rotation] as [number,number,number]}));
 let lights=(world.lights??[]).map(l=>({...l,position:l.position?[...l.position] as [number,number,number]:undefined,rotation:l.rotation?[...l.rotation] as [number,number,number]:undefined}));
 for(const track of tracks(world)){
  const value=evaluateAnimationKeyframes(track.keyframes,worldTime);
  if(value===undefined)continue;
  if(track.targetType==="mesh")meshes=meshes.map(m=>m.id===track.targetId?applyMeshTrack(m,track.property,value):m);
  else if(track.targetType==="camera")cameras=cameras.map(c=>c.id===track.targetId?applyCameraTrack(c,track.property,value):c);
  else lights=lights.map(l=>l.id===track.targetId?applyLightTrack(l,track.property,value):l);
 }
 return{worldTime,meshes,cameras,lights};
}
function numberValue(v:AnimationValue):number|undefined{return typeof v==="number"?v:undefined}
function applyMeshTrack(mesh:Graphics3DMesh,property:Graphics3DTrack["property"],value:AnimationValue):Graphics3DMesh{
 const n=numberValue(value),t={...mesh.transform,position:[...mesh.transform.position] as [number,number,number],rotation:[...mesh.transform.rotation] as [number,number,number],scale:[...mesh.transform.scale] as [number,number,number]};
 if(n!==undefined){if(property==="positionX")t.position[0]=n;else if(property==="positionY")t.position[1]=n;else if(property==="positionZ")t.position[2]=n;else if(property==="rotationX")t.rotation[0]=n;else if(property==="rotationY")t.rotation[1]=n;else if(property==="rotationZ")t.rotation[2]=n;else if(property==="scaleX")t.scale[0]=n;else if(property==="scaleY")t.scale[1]=n;else if(property==="scaleZ")t.scale[2]=n;}
 if(property==="opacity"&&n!==undefined)return{...mesh,transform:t,opacity:n};
 if(property==="materialOpacity"&&n!==undefined)return{...mesh,transform:t,material:{...(mesh.material??{}),opacity:n}};
 if(property==="materialColor"&&typeof value==="string")return{...mesh,transform:t,material:{...(mesh.material??{}),color:value}};
 if(property==="visibility"&&typeof value==="boolean")return{...mesh,transform:t,visible:value};
 return{...mesh,transform:t}
}
function applyCameraTrack(camera:Graphics3DCamera,property:Graphics3DTrack["property"],value:AnimationValue):Graphics3DCamera{const n=numberValue(value);const c={...camera,position:[...camera.position] as [number,number,number],rotation:[...camera.rotation] as [number,number,number]};if(n===undefined)return c;if(property==="positionX")c.position[0]=n;else if(property==="positionY")c.position[1]=n;else if(property==="positionZ")c.position[2]=n;else if(property==="rotationX")c.rotation[0]=n;else if(property==="rotationY")c.rotation[1]=n;else if(property==="rotationZ")c.rotation[2]=n;else if(property==="fov")c.fov=n;return c}
function applyLightTrack(light:Graphics3DLight,property:Graphics3DTrack["property"],value:AnimationValue):Graphics3DLight{const n=numberValue(value);const l={...light,position:light.position?[...light.position] as [number,number,number]:undefined,rotation:light.rotation?[...light.rotation] as [number,number,number]:undefined};if(n!==undefined){if(property==="positionX"){l.position??=[0,0,0];l.position[0]=n}else if(property==="positionY"){l.position??=[0,0,0];l.position[1]=n}else if(property==="positionZ"){l.position??=[0,0,0];l.position[2]=n}else if(property==="rotationX"){l.rotation??=[0,0,0];l.rotation[0]=n}else if(property==="rotationY"){l.rotation??=[0,0,0];l.rotation[1]=n}else if(property==="rotationZ"){l.rotation??=[0,0,0];l.rotation[2]=n}else if(property==="intensity")l.intensity=n;else if(property==="distance")l.distance=n;else if(property==="angle")l.angle=n;else if(property==="penumbra")l.penumbra=n;}if(property==="materialColor"&&typeof value==="string")l.color=value;return l}
