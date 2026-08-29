import type { Graphics3DCamera, Graphics3DLight, Graphics3DMaterial, Graphics3DMesh, Graphics3DWorld, Graphics3DTrack, Keyframe } from "../types";

export type WorldOperation =
  | { type: "add-mesh"; mesh: Graphics3DMesh; index?: number }
  | { type: "remove-mesh"; mesh: Graphics3DMesh; index: number }
  | { type: "update-mesh"; meshId: string; from: Partial<Graphics3DMesh>; to: Partial<Graphics3DMesh> }
  | { type: "set-mesh-transform"; meshId: string; from: Graphics3DMesh["transform"]; to: Graphics3DMesh["transform"] }
  | { type: "add-camera"; camera: Graphics3DCamera; index?: number }
  | { type: "remove-camera"; camera: Graphics3DCamera; index: number }
  | { type: "update-camera"; cameraId: string; from: Partial<Graphics3DCamera>; to: Partial<Graphics3DCamera> }
  | { type: "set-camera-transform"; cameraId: string; from: Pick<Graphics3DCamera, "position" | "rotation">; to: Pick<Graphics3DCamera, "position" | "rotation"> }
  | { type: "add-light"; light: Graphics3DLight; index?: number }
  | { type: "remove-light"; light: Graphics3DLight; index: number }
  | { type: "update-light"; lightId: string; from: Partial<Graphics3DLight>; to: Partial<Graphics3DLight> }
  | { type: "add-material"; meshId: string; material: Graphics3DMaterial }
  | { type: "remove-material"; meshId: string; material: Graphics3DMaterial }
  | { type: "update-material"; meshId: string; from?: Graphics3DMaterial; to?: Graphics3DMaterial }
  | { type: "add-3d-track"; track: Graphics3DTrack; index?: number }
  | { type: "remove-3d-track"; track: Graphics3DTrack; index: number }
  | { type: "update-3d-track"; trackId: string; from: Partial<Graphics3DTrack>; to: Partial<Graphics3DTrack> }
  | { type: "add-3d-keyframe"; trackId: string; keyframe: Keyframe; index?: number }
  | { type: "remove-3d-keyframe"; trackId: string; keyframe: Keyframe; index: number }
  | { type: "update-3d-keyframe"; trackId: string; keyframeId: string; from: Partial<Keyframe>; to: Partial<Keyframe> }
  | { type: "move-3d-keyframe"; trackId: string; keyframeId: string; fromTime: number; toTime: number };

export interface WorldHistoryEntry { id: string; timestamp: number; label: string; actor: string; operation: WorldOperation }
export interface WorldHistory { worldId: string; entries: WorldHistoryEntry[] }

function insert<T>(items: T[], value: T, index?: number): T[] { const next=[...items]; next.splice(Math.max(0,Math.min(index??next.length,next.length)),0,value); return next; }
function remove<T extends {id:string}>(items:T[],id:string):T[]{return items.filter(item=>item.id!==id)}
function updateById<T extends {id:string}>(items:T[],id:string,patch:Partial<T>):T[]{return items.map(item=>item.id===id?{...item,...patch}:item)}
function tracks(world:Graphics3DWorld):Graphics3DTrack[]{return (world as Graphics3DWorld & {animationTracks?:Graphics3DTrack[]}).animationTracks??[]}
function withTracks(world:Graphics3DWorld,value:Graphics3DTrack[]):Graphics3DWorld{return {...world,animationTracks:value} as Graphics3DWorld}
function updateTrack(world:Graphics3DWorld,id:string,fn:(track:Graphics3DTrack)=>Graphics3DTrack):Graphics3DWorld{return withTracks(world,tracks(world).map(track=>track.id===id?fn(track):track))}

export function applyWorldOperation(world:Graphics3DWorld, operation:WorldOperation, reverse=false):Graphics3DWorld {
  if(operation.type==="add-mesh")return{...world,meshes:reverse?remove(world.meshes,operation.mesh.id):insert(world.meshes,operation.mesh,operation.index)};
  if(operation.type==="remove-mesh")return{...world,meshes:reverse?insert(world.meshes,operation.mesh,operation.index):remove(world.meshes,operation.mesh.id)};
  if(operation.type==="update-mesh")return{...world,meshes:updateById(world.meshes,operation.meshId,reverse?operation.from:operation.to)};
  if(operation.type==="set-mesh-transform")return{...world,meshes:world.meshes.map(mesh=>mesh.id===operation.meshId?{...mesh,transform:reverse?operation.from:operation.to}:mesh)};
  if(operation.type==="add-camera")return{...world,cameras:reverse?remove(world.cameras,operation.camera.id):insert(world.cameras,operation.camera,operation.index)};
  if(operation.type==="remove-camera")return{...world,cameras:reverse?insert(world.cameras,operation.camera,operation.index):remove(world.cameras,operation.camera.id)};
  if(operation.type==="update-camera")return{...world,cameras:updateById(world.cameras,operation.cameraId,reverse?operation.from:operation.to)};
  if(operation.type==="set-camera-transform")return{...world,cameras:world.cameras.map(camera=>camera.id===operation.cameraId?{...camera,...(reverse?operation.from:operation.to)}:camera)};
  if(operation.type==="add-light")return{...world,lights:reverse?remove(world.lights??[],operation.light.id):insert(world.lights??[],operation.light,operation.index)};
  if(operation.type==="remove-light")return{...world,lights:reverse?insert(world.lights??[],operation.light,operation.index):remove(world.lights??[],operation.light.id)};
  if(operation.type==="update-light")return{...world,lights:updateById(world.lights??[],operation.lightId,reverse?operation.from:operation.to)};
  if(operation.type==="add-material")return{...world,meshes:world.meshes.map(m=>m.id===operation.meshId?{...m,material:reverse?undefined:operation.material}:m)};
  if(operation.type==="remove-material")return{...world,meshes:world.meshes.map(m=>m.id===operation.meshId?{...m,material:reverse?operation.material:undefined}:m)};
  if(operation.type==="update-material")return{...world,meshes:world.meshes.map(m=>m.id===operation.meshId?{...m,material:reverse?operation.from:operation.to}:m)};
  if(operation.type==="add-3d-track")return withTracks(world,reverse?remove(tracks(world),operation.track.id):insert(tracks(world),operation.track,operation.index));
  if(operation.type==="remove-3d-track")return withTracks(world,reverse?insert(tracks(world),operation.track,operation.index):remove(tracks(world),operation.track.id));
  if(operation.type==="update-3d-track")return withTracks(world,updateById(tracks(world),operation.trackId,reverse?operation.from:operation.to));
  if(operation.type==="add-3d-keyframe")return updateTrack(world,operation.trackId,track=>({...track,keyframes:reverse?remove(track.keyframes,operation.keyframe.id):insert(track.keyframes,operation.keyframe,operation.index)}));
  if(operation.type==="remove-3d-keyframe")return updateTrack(world,operation.trackId,track=>({...track,keyframes:reverse?insert(track.keyframes,operation.keyframe,operation.index):remove(track.keyframes,operation.keyframe.id)}));
  if(operation.type==="update-3d-keyframe")return updateTrack(world,operation.trackId,track=>({...track,keyframes:updateById(track.keyframes,operation.keyframeId,reverse?operation.from:operation.to)}));
  return updateTrack(world,operation.trackId,track=>({...track,keyframes:track.keyframes.map(k=>k.id===operation.keyframeId?{...k,time:reverse?operation.fromTime:operation.toTime}:k).sort((a,b)=>a.time-b.time)}));
}

export function invertWorldOperation(operation:WorldOperation):WorldOperation {
  switch(operation.type){
    case "add-mesh":return{type:"remove-mesh",mesh:operation.mesh,index:operation.index??0}; case "remove-mesh":return{type:"add-mesh",mesh:operation.mesh,index:operation.index};
    case "add-camera":return{type:"remove-camera",camera:operation.camera,index:operation.index??0}; case "remove-camera":return{type:"add-camera",camera:operation.camera,index:operation.index};
    case "add-light":return{type:"remove-light",light:operation.light,index:operation.index??0}; case "remove-light":return{type:"add-light",light:operation.light,index:operation.index};
    case "add-material":return{type:"remove-material",meshId:operation.meshId,material:operation.material}; case "remove-material":return{type:"add-material",meshId:operation.meshId,material:operation.material};
    case "update-material":return{...operation,from:operation.to,to:operation.from}; case "update-mesh":return{...operation,from:operation.to,to:operation.from}; case "update-camera":return{...operation,from:operation.to,to:operation.from}; case "update-light":return{...operation,from:operation.to,to:operation.from};
    case "set-mesh-transform":return{...operation,from:operation.to,to:operation.from}; case "set-camera-transform":return{...operation,from:operation.to,to:operation.from};
    case "add-3d-track":return{type:"remove-3d-track",track:operation.track,index:operation.index??0}; case "remove-3d-track":return{type:"add-3d-track",track:operation.track,index:operation.index};
    case "update-3d-track":return{...operation,from:operation.to,to:operation.from}; case "add-3d-keyframe":return{type:"remove-3d-keyframe",trackId:operation.trackId,keyframe:operation.keyframe,index:operation.index??0}; case "remove-3d-keyframe":return{type:"add-3d-keyframe",trackId:operation.trackId,keyframe:operation.keyframe,index:operation.index};
    case "update-3d-keyframe":return{...operation,from:operation.to,to:operation.from}; case "move-3d-keyframe":return{...operation,fromTime:operation.toTime,toTime:operation.fromTime};
  }
}
