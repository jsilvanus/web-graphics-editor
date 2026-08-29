import { describe, expect, it } from "vitest";
import { applyWorldOperation, invertWorldOperation, type WorldOperation } from "./worldOperations";
import type { Graphics3DWorld } from "../types";

const world = (): Graphics3DWorld => ({ id: "w", meshes: [{ id: "m", geometry: { vertices: [], indices: [] }, transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } }], cameras: [{ id: "c", position: [0,0,0], rotation: [0,0,0], projection: "perspective" }], lights: [] });
const roundTrip = (initial: Graphics3DWorld, op: WorldOperation) => applyWorldOperation(applyWorldOperation(initial, op), op, true);

describe("3D world history operations", () => {
  it("handles mesh CRUD/update", () => {
    const initial=world(),mesh={...initial.meshes[0],id:"m2"};
    expect(applyWorldOperation(initial,{type:"add-mesh",mesh}).meshes.map(m=>m.id)).toEqual(["m","m2"]);
    expect(applyWorldOperation(initial,{type:"remove-mesh",mesh:initial.meshes[0],index:0}).meshes).toHaveLength(0);
    expect(applyWorldOperation(initial,{type:"update-mesh",meshId:"m",from:{name:undefined},to:{name:"Cube"}}).meshes[0].name).toBe("Cube");
  });
  it("handles camera CRUD/update", () => {
    const initial=world(),camera={id:"c2",position:[1,2,3] as [number,number,number],rotation:[0,0,0] as [number,number,number],projection:"orthographic" as const};
    expect(applyWorldOperation(initial,{type:"add-camera",camera}).cameras).toHaveLength(2);
    expect(applyWorldOperation(initial,{type:"remove-camera",camera:initial.cameras[0],index:0}).cameras).toHaveLength(0);
    expect(applyWorldOperation(initial,{type:"update-camera",cameraId:"c",from:{},to:{name:"Main"}}).cameras[0].name).toBe("Main");
  });
  it("handles light CRUD/update", () => {
    const initial=world(),light={id:"l",type:"point" as const,intensity:2},withLight=applyWorldOperation(initial,{type:"add-light",light});
    expect(withLight.lights).toHaveLength(1);
    expect(applyWorldOperation(withLight,{type:"remove-light",light,index:0}).lights).toHaveLength(0);
    expect(applyWorldOperation(withLight,{type:"update-light",lightId:"l",from:{intensity:2},to:{intensity:5}}).lights![0].intensity).toBe(5);
  });
  it("handles material CRUD/update", () => {
    const initial=world(),material={color:"red",roughness:.5},withMaterial=applyWorldOperation(initial,{type:"add-material",meshId:"m",material});
    expect(withMaterial.meshes[0].material).toEqual(material);
    expect(applyWorldOperation(withMaterial,{type:"update-material",meshId:"m",from:material,to:{color:"blue"}}).meshes[0].material).toEqual({color:"blue"});
    expect(applyWorldOperation(withMaterial,{type:"remove-material",meshId:"m",material}).meshes[0].material).toBeUndefined();
  });
  it("stores 3D animation tracks in the world timeline", () => {
    const initial=world(),track={id:"t",targetType:"mesh" as const,targetId:"m",property:"positionX" as const,keyframes:[]};
    const withTrack=applyWorldOperation(initial,{type:"add-3d-track",track});
    expect(withTrack.timeline?.tracks).toEqual([track]);
    expect((withTrack as any).animationTracks).toBeUndefined();
    const updated=applyWorldOperation(withTrack,{type:"update-3d-track",trackId:"t",from:{property:"positionX"},to:{property:"positionY"}});
    expect(updated.timeline?.tracks[0].property).toBe("positionY");
    expect(applyWorldOperation(updated,{type:"remove-3d-track",track,index:0}).timeline?.tracks).toEqual([]);
  });
  it("adds, removes, updates and moves 3D keyframes in the world timeline", () => {
    let current=applyWorldOperation(world(),{type:"add-3d-track",track:{id:"t",targetType:"mesh",targetId:"m",property:"positionX",keyframes:[]}});
    const keyframe={id:"k",time:1,value:10,easing:"linear" as const};
    current=applyWorldOperation(current,{type:"add-3d-keyframe",trackId:"t",keyframe});
    current=applyWorldOperation(current,{type:"update-3d-keyframe",trackId:"t",keyframeId:"k",from:{value:10},to:{value:20}});
    expect(current.timeline?.tracks[0].keyframes[0].value).toBe(20);
    current=applyWorldOperation(current,{type:"move-3d-keyframe",trackId:"t",keyframeId:"k",fromTime:1,toTime:3});
    expect(current.timeline?.tracks[0].keyframes[0].time).toBe(3);
    current=applyWorldOperation(current,{type:"remove-3d-keyframe",trackId:"t",keyframe:keyframe,index:0});
    expect(current.timeline?.tracks[0].keyframes).toEqual([]);
  });
  it("restores the complete world including timeline on undo", () => {
    const initial=world(),track={id:"t",targetType:"mesh" as const,targetId:"m",property:"positionX" as const,keyframes:[]};
    for(const op of [{type:"add-3d-track",track},{type:"add-3d-keyframe",trackId:"t",keyframe:{id:"k",time:1,value:1}}] as WorldOperation[]) expect(roundTrip(initial,op)).toEqual(initial);
    expect(invertWorldOperation({type:"add-3d-track",track})).toEqual({type:"remove-3d-track",track,index:0});
  });
});
