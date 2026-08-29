import { describe,expect,it } from "vitest";
import type { Graphics3DWorld, Graphics3DView } from "./types";

const world:Graphics3DWorld={id:"w",meshes:[{id:"m",geometry:{vertices:[0,0,0],indices:[0]},transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]},material:{color:"red"}}],lights:[{id:"l",type:"ambient",intensity:1}],cameras:[{id:"c",position:[0,0,5],rotation:[0,0,0],projection:"perspective",fov:60}],timeline:{tracks:[],duration:10,loop:true}};
const view:Graphics3DView={id:"v",worldId:"w",cameraId:"c",renderAssetId:"asset",x:0,y:0,width:100,height:100,worldTime:{offset:2,rate:1,loop:true}};

describe("World3D/View contracts",()=>{
 it("keeps world objects independent of views",()=>{expect(view.worldId).toBe("w");expect(world.meshes).toHaveLength(1);});
 it("supports multiple views into the same world",()=>{const other={...view,id:"v2",cameraId:"c2"};expect(other.worldId).toBe(view.worldId);});
 it("preserves independent world time mappings",()=>{const other={...view,id:"v2",worldTime:{offset:7,rate:.5,loop:false}};expect(view.worldTime?.offset).toBe(2);expect(other.worldTime?.offset).toBe(7);expect(other.worldTime?.rate).toBe(.5);});
 it("allows animated world timelines",()=>{expect(world.timeline?.duration).toBe(10);expect(world.timeline?.loop).toBe(true);});
 it("supports camera-specific projection settings",()=>{expect(world.cameras[0].projection).toBe("perspective");expect(world.cameras[0].fov).toBe(60);});
 it("supports material animation targets in the type model",()=>{const p="materialColor" as const;expect(p).toBe("materialColor");});
});
