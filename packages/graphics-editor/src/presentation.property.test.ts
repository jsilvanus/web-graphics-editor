import { describe, expect, it } from "vitest";
import { resolveComposition, resolveOutput, resolveScene, resolveViewportComposition, sceneAtTime } from "./presentation";
import type { GraphicsDocument } from "./types";

const base:GraphicsDocument={width:100,height:100,layers:[{id:"a",type:"rectangle",x:1,y:2,width:10,height:20,opacity:1,visible:true,viewportOverrides:{v:{x:50,opacity:.5}}}],compositions:[{id:"c",name:"C",layerIds:["a"]}],viewports:[{id:"v",name:"V",width:100,height:100,compositionIds:["c"]}],timeline:{scenes:[{id:"s1",name:"S1",compositionId:"c",start:0,duration:2},{id:"s2",name:"S2",compositionId:"c",start:2,duration:3}],currentSceneId:"s1",currentTime:0,tracks:[],loop:false},outputs:[{id:"o",name:"O",viewportId:"v",playback:"static",background:"transparent"}]};

describe("presentation edge cases",()=>{
 it("returns undefined for unknown IDs",()=>{expect(resolveComposition(base,"x")).toBeUndefined();expect(resolveViewportComposition(base,"x")).toBeUndefined();expect(resolveScene(base,1,"x")).toBeUndefined();expect(resolveOutput(base,"x",1)).toBeUndefined();});
 it("applies only defined viewport overrides",()=>{const r=resolveViewportComposition(base,"v")!;const a=r.layers[0];expect(a.x).toBe(50);expect(a.y).toBe(2);expect(a.opacity).toBe(.5);expect(a.visible).toBe(true);});
 it("does not mutate nested viewport override objects",()=>{const before=JSON.stringify(base);resolveViewportComposition(base,"v");expect(JSON.stringify(base)).toBe(before);});
 it("uses scene boundaries consistently",()=>{expect(sceneAtTime(base.timeline,0)?.id).toBe("s1");expect(sceneAtTime(base.timeline,2)?.id).toBe("s2");expect(sceneAtTime(base.timeline,4.999)?.id).toBe("s2");expect(sceneAtTime(base.timeline,5)).toBeUndefined();});
 it("supports negative and out-of-range times without loop",()=>{expect(sceneAtTime(base.timeline,-1)).toBeUndefined();expect(sceneAtTime(base.timeline,99)).toBeUndefined();});
 it("returns local scene time from the selected scene",()=>{const r=resolveScene(base,3,"v")!;expect(r.scene.id).toBe("s2");expect(r.localTime).toBe(1);});
});
