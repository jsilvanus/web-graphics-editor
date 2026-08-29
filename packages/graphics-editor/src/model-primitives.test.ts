import { describe, expect, it } from "vitest";
import type { GraphicsDocument, Layer } from "./types";
import { getChildLayers, getDescendantIds, getLayerTreeBounds, getRootLayers } from "./layer-tree";

const layer=(id:string, extra:Partial<Layer>={}):Layer=>({id,type:"rectangle",x:0,y:0,width:10,height:20,...extra});

describe("WEGRA model primitives",()=>{
 it("keeps layer IDs deterministic and resolves missing children safely",()=>{const layers=[layer("a"),layer("b",{parentId:"a"})];expect(getRootLayers(layers).map(x=>x.id)).toEqual(["a"]);expect(getChildLayers(layers,"a").map(x=>x.id)).toEqual(["b"]);expect(getChildLayers(layers,"missing")).toEqual([]);});
 it("walks descendants without cycles",()=>{const layers=[layer("a",{children:["b"]}),layer("b",{parentId:"a",children:["c"]}),layer("c",{parentId:"b",children:["a"]})];expect([...getDescendantIds(layers,"a")]).toEqual(["a","b","c"]);});
 it("calculates leaf bounds",()=>expect(getLayerTreeBounds([layer("a",{x:5,y:7,width:30,height:40})],"a")).toEqual({x:5,y:7,width:30,height:40}));
 it("calculates subtree bounds",()=>{const layers=[layer("g",{children:["a","b"]}),layer("a",{parentId:"g",x:10,y:20,width:30,height:40}),layer("b",{parentId:"g",x:-5,y:50,width:10,height:10})];expect(getLayerTreeBounds(layers,"g")).toEqual({x:-5,y:20,width:45,height:40});});
 it("calculates rotated bounds",()=>{const layers=[layer("a",{x:0,y:0,width:10,height:20,rotation:90})];const b=getLayerTreeBounds(layers,"a");expect(b.x).toBeCloseTo(-5);expect(b.y).toBeCloseTo(5);expect(b.width).toBeCloseTo(20);expect(b.height).toBeCloseTo(10);});
 it("permits the complete architectural document shape",()=>{const d:GraphicsDocument={width:1920,height:1080,layers:[layer("l")],compositions:[{id:"c",name:"C",layerIds:["l"]}],viewports:[{id:"v",name:"V",width:1920,height:1080,compositionIds:["c"]}],timeline:{scenes:[{id:"s",name:"S",compositionId:"c",start:0,duration:10}],currentSceneId:"s",currentTime:0,tracks:[]},outputs:[{id:"o",name:"O",viewportId:"v",playback:"live",background:"transparent"}]};expect(d.outputs?.[0].viewportId).toBe("v");});
});
