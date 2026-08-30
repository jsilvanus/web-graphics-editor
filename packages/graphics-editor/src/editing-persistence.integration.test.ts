import {describe,expect,it} from "vitest";
import type {GraphicsDocument,Layer} from "./types";
import {addLayerCommand,groupLayersCommand,updateLayerCommand} from "./document/commands";
import {applyOperation,invertOperation} from "./history/operations";
import {serializeGraphicsDocument,deserializeGraphicsDocument} from "./serialization";
const layer=(id:string,x:number):Layer=>({id,type:"rectangle",x,y:0,width:100,height:50,opacity:1,visible:true});
const initial=():GraphicsDocument=>({width:1920,height:1080,layers:[layer("a",0),layer("b",200)],compositions:[{id:"c",name:"Main",layerIds:["a","b"]}],viewports:[{id:"v",name:"Main",width:1920,height:1080,compositionIds:["c"]}],timeline:{scenes:[{id:"s",name:"Scene",compositionId:"c",start:0,duration:10}],currentSceneId:"s",currentTime:0,tracks:[]},outputs:[{id:"o",name:"Output",viewportId:"v",playback:"live",background:"transparent"}]});

describe("editing → history → persistence",()=>{
 it("applies a sequence of edits",()=>{let d=initial();d=updateLayerCommand(d,"a",{x:100,opacity:.75}).document;d=addLayerCommand(d,layer("c",400)).document;expect(d.layers.map(x=>x.id)).toEqual(["a","b","c"]);expect(d.layers[0].x).toBe(100);});
 it("undoes each command to the previous document",()=>{let d=initial();const r1=updateLayerCommand(d,"a",{x:100});const r2=addLayerCommand(r1.document,layer("c",400));expect(applyOperation(r2.document,invertOperation(r2.operation!))).toEqual(r1.document);expect(applyOperation(r1.document,invertOperation(r1.operation!))).toEqual(d);});
 it("round trips edited compositions and outputs",()=>{let d=initial();d=updateLayerCommand(d,"a",{x:321}).document;const r=deserializeGraphicsDocument(serializeGraphicsDocument(d));expect(r.layers.find(x=>x.id==="a")?.x).toBe(321);expect(r.compositions?.[0].layerIds).toEqual(["a","b"]);expect(r.outputs?.[0].viewportId).toBe("v");});
 it("preserves group structure through persistence",()=>{const r=groupLayersCommand(initial(),new Set(["a","b"]));const restored=deserializeGraphicsDocument(serializeGraphicsDocument(r.document));const group=restored.layers.find(x=>x.type==="group");expect(group?.children).toEqual(["a","b"]);expect(restored.layers.find(x=>x.id==="a")?.parentId).toBe(group?.id);});
});
