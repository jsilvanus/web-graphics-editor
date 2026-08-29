import { describe,expect,it } from "vitest";
import { sceneAtTime, resolveScene } from "./presentation";
import type { GraphicsDocument } from "./types";

const d=(loop=false):GraphicsDocument=>({width:100,height:100,layers:[{id:"a",type:"rectangle",x:0,y:0,width:10,height:10}],compositions:[{id:"c",name:"C",layerIds:["a"]}],viewports:[{id:"v",name:"V",width:100,height:100,compositionIds:["c"]}],timeline:{scenes:[{id:"a",name:"A",compositionId:"c",start:0,duration:1},{id:"b",name:"B",compositionId:"c",start:1,duration:2},{id:"c",name:"C",compositionId:"c",start:3,duration:4}],currentSceneId:"a",currentTime:0,tracks:[],loop}});

describe("scene timeline",()=>{
 it("selects first, middle and final scenes",()=>{const t=d().timeline!;expect(sceneAtTime(t,0)?.id).toBe("a");expect(sceneAtTime(t,1)?.id).toBe("b");expect(sceneAtTime(t,2.99)?.id).toBe("b");expect(sceneAtTime(t,3)?.id).toBe("c");});
 it("ends at the exact non-loop duration",()=>expect(sceneAtTime(d().timeline!,7)).toBeUndefined());
 it("loops exactly at total duration",()=>expect(sceneAtTime(d(true).timeline!,7)?.id).toBe("a"));
 it("preserves local time after loop",()=>{const r=resolveScene(d(true),8.5,"v")!;expect(r.scene.id).toBe("b");expect(r.localTime).toBeCloseTo(.5);});
 it("handles gaps between scenes",()=>{const x=d();x.timeline!.scenes[1].start=2;expect(sceneAtTime(x.timeline!,1.5)).toBeUndefined();});
 it("handles zero-duration scenes without selecting them",()=>{const x=d();x.timeline!.scenes[0].duration=0;expect(sceneAtTime(x.timeline!,0)?.id).not.toBe("a");});
});
