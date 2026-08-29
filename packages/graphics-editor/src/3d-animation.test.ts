import { describe, expect, it } from "vitest";
import { create3DTrack, evaluate3DViewAtTime, evaluate3DWorldAtTime, interpolate3DKeyframes } from "./3d-animation";
import type { Graphics3DWorld, SceneTimeline } from "./types";

describe("3D animation",()=>{
 const world:Graphics3DWorld={id:"world",meshes:[{id:"mesh",geometry:{vertices:[0,0,0],indices:[0,0,0]},transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}}],cameras:[{id:"camera",position:[0,0,5],rotation:[0,0,0],projection:"perspective",fov:50}],timeline:{tracks:[create3DTrack("t","mesh","mesh","positionX",[{id:"a",time:0,value:0},{id:"b",time:2,value:10}]),create3DTrack("c","camera","camera","fov",[{id:"c1",time:0,value:50},{id:"c2",time:2,value:70}])]}};
 const timeline:SceneTimeline={scenes:[{id:"s",name:"Scene",start:0,duration:5}],currentSceneId:"s",currentTime:0,tracks:[]};
 it("interpolates numeric keyframes",()=>expect(interpolate3DKeyframes([{id:"a",time:0,value:0},{id:"b",time:2,value:10}],1)).toBe(5));
 it("evaluates mesh and camera animation from the world timeline",()=>{const at=evaluate3DWorldAtTime(world,1);expect(at.meshes[0].transform.position[0]).toBe(5);expect(at.cameras[0].fov).toBe(60);expect(world.meshes[0].transform.position[0]).toBe(0);});
 it("evaluates 3D view composition properties from the main timeline",()=>{const view={id:"v",worldId:"world",cameraId:"camera",x:0,y:0,width:100,height:100,opacity:1};const t={...timeline,tracks:[{id:"x",layerId:"v",property:"width" as const,keyframes:[{id:"a",time:0,value:100},{id:"b",time:1,value:200}]},{id:"o",layerId:"v",property:"opacity" as const,keyframes:[{id:"c",time:0,value:1},{id:"d",time:1,value:.25}]}]};const at=evaluate3DViewAtTime(view,t,.5);expect(at.width).toBe(150);expect(at.opacity).toBe(.625);});
});
