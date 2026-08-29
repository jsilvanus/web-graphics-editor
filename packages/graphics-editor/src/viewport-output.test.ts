import { describe, expect, it } from "vitest";
import type { GraphicsDocument } from "./types";
import { resolveOutput, resolveViewportComposition } from "./presentation";

const make=():GraphicsDocument=>({width:100,height:100,layers:[{id:"a",type:"rectangle",x:0,y:0,width:10,height:10,visible:true},{id:"b",type:"text",x:10,y:10,width:20,height:10,visible:true,viewportOverrides:{venue:{visible:false},wide:{x:50}}}],compositions:[{id:"c1",name:"C1",layerIds:["a","b"]},{id:"c2",name:"C2",layerIds:["b"]}],viewports:[{id:"venue",name:"Venue",width:100,height:200,compositionIds:["c1"]},{id:"wide",name:"Wide",width:200,height:100,compositionIds:["c2"]}],outputs:[{id:"o1",name:"O1",viewportId:"venue",playback:"static",background:"transparent"},{id:"o2",name:"O2",viewportId:"wide",playback:"automatic",background:"opaque",autoplay:true}]});

describe("viewport/output contracts",()=>{
 it("supports different compositions per viewport",()=>{const d=make();expect(resolveViewportComposition(d,"venue")?.composition.id).toBe("c1");expect(resolveViewportComposition(d,"wide")?.composition.id).toBe("c2");});
 it("isolates visibility between viewports",()=>{const d=make();expect(resolveViewportComposition(d,"venue")?.layers.find(x=>x.id==="b")?.visible).toBe(false);expect(resolveViewportComposition(d,"wide")?.layers.find(x=>x.id==="b")?.visible).toBe(true);});
 it("allows multiple outputs to resolve independently",()=>{const d=make();expect(resolveOutput(d,"o1",0)?.viewport.id).toBe("venue");expect(resolveOutput(d,"o2",0)?.viewport.id).toBe("wide");});
 it("keeps output playback configuration separate from viewport geometry",()=>{const d=make();expect(d.outputs?.[0].playback).toBe("static");expect(d.outputs?.[1].playback).toBe("automatic");expect(d.viewports?.[0].height).toBe(200);});
});
