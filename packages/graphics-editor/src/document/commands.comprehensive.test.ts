import {describe,expect,it} from "vitest";
import type {GraphicsDocument,Layer} from "../types";
import {addLayerCommand,removeLayerCommand,updateLayerCommand,updateLayerStyleCommand,reorderLayerCommand,groupLayersCommand,ungroupLayerCommand,alignLayersCommand,distributeLayersCommand} from "./commands";
import {applyOperation,invertOperation} from "../history/operations";
const L=(id:string,x=0):Layer=>({id,type:"rectangle",x,y:0,width:10,height:10});
const D=():GraphicsDocument=>({width:100,height:100,layers:[L("a",0),L("b",20),L("c",40)]});

describe("document editing commands",()=>{
 it("adds at beginning, middle and end",()=>{let d=D();let r=addLayerCommand(d,L("x"),0);expect(r.document.layers.map(x=>x.id)).toEqual(["x","a","b","c"]);r=addLayerCommand(d,L("x"),2);expect(r.document.layers.map(x=>x.id)).toEqual(["a","b","x","c"]);r=addLayerCommand(d,L("x"));expect(r.document.layers.at(-1)?.id).toBe("x");});
 it("clamps insertion indices",()=>{expect(addLayerCommand(D(),L("x"),-10).document.layers[0].id).toBe("x");expect(addLayerCommand(D(),L("x"),999).document.layers.at(-1)?.id).toBe("x");});
 it("removes and records the original layer",()=>{const d=D(),r=removeLayerCommand(d,"b");expect(r.document.layers.map(x=>x.id)).toEqual(["a","c"]);expect(r.operation?.type).toBe("remove-layer");expect(applyOperation(r.document,r.operation!,true)).toEqual(d);});
 it("updates only the requested layer",()=>{const d=D(),r=updateLayerCommand(d,"b",{x:33,opacity:.5});expect(r.document.layers.find(x=>x.id==="b")).toMatchObject({x:33,opacity:.5});expect(r.document.layers.find(x=>x.id==="a")).toEqual(d.layers[0]);});
 it("does not create history for no-op updates",()=>{const d=D(),r=updateLayerCommand(d,"a",{x:0});expect(r.operation).toBeUndefined();expect(r.document).toEqual(d);});
 it("updates and deletes style properties",()=>{const d=D();const a=updateLayerStyleCommand(d,"a","fill","red");expect(a.document.layers[0].style?.fill).toBe("red");const b=updateLayerStyleCommand(a.document,"a","fill",undefined);expect(b.document.layers[0].style?.fill).toBeUndefined();});
 it("reorders every direction and is reversible",()=>{for(const action of ["forward","backward","front","back"] as const){const d=D();const r=reorderLayerCommand(d,"b",action);if(r.operation){expect(applyOperation(r.document,r.operation,true)).toEqual(d);}}});
 it("does not reorder missing or boundary layers",()=>{const d=D();expect(reorderLayerCommand(d,"missing","front").operation).toBeUndefined();expect(reorderLayerCommand(d,"a","backward").operation).toBeUndefined();expect(reorderLayerCommand(d,"c","forward").operation).toBeUndefined();});
 it("groups selected layers and records undo information",()=>{const d=D(),r=groupLayersCommand(d,new Set(["a","b"]));expect(r.document.layers.some(x=>x.type==="group")).toBe(true);expect(r.document.layers.find(x=>x.id==="a")?.parentId).toBe(r.document.layers.find(x=>x.type==="group")?.id);expect(r.operation).toBeDefined();expect(applyOperation(r.document,r.operation!,true)).toEqual(d);});
 it("ungroups and restores original structure",()=>{const grouped=groupLayersCommand(D(),new Set(["a","b"]));const r=ungroupLayerCommand(grouped.document,grouped.groupId);expect(r.document).toEqual(D());expect(applyOperation(r.document,r.operation!,true)).toEqual(grouped.document);});
 it("rejects grouping fewer than two layers",()=>{const d=D();expect(groupLayersCommand(d,new Set(["a"])).operation).toBeUndefined();});
 it("aligns and distributes without changing layer count",()=>{const d=D();const a=alignLayersCommand(d,new Set(["a","b"]),"left","canvas");expect(a.document.layers).toHaveLength(3);const dist=distributeLayersCommand(d,new Set(["a","b","c"]),"horizontal");expect(dist.document.layers).toHaveLength(3);});
 it("round-trips every generated operation through inverse",()=>{const d=D();for(const r of [addLayerCommand(d,L("x")),removeLayerCommand(d,"b"),updateLayerCommand(d,"a",{x:9}),updateLayerStyleCommand(d,"a","opacity",.4),reorderLayerCommand(d,"a","front")]){if(r.operation){expect(applyOperation(r.document,invertOperation(r.operation))).toEqual(d);}}});
});
