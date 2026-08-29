import { describe, expect, it } from "vitest";
import { serializeGraphicsDocument, deserializeGraphicsDocument } from "./serialization";
import type { GraphicsDocument } from "./types";

const doc:GraphicsDocument={width:1920,height:1080,layers:[{id:"a",type:"text",x:1,y:2,width:100,height:20,text:"hello",opacity:.5,viewportOverrides:{v:{visible:false,x:10}}}],compositions:[{id:"c",name:"C",layerIds:["a"]}],viewports:[{id:"v",name:"V",width:1080,height:1920,compositionIds:["c"]}],timeline:{scenes:[{id:"s",name:"S",compositionId:"c",start:0,duration:10}],currentSceneId:"s",currentTime:3,tracks:[]},worlds3d:[{id:"w",name:"W",meshes:[],cameras:[{id:"cam",position:[0,0,1],rotation:[0,0,0],projection:"perspective"}]}],views3d:[],outputs:[{id:"o",name:"O",viewportId:"v",playback:"automatic",background:"transparent",autoplay:true}]};

describe("serialization robustness",()=>{
 it("round trips the architectural graph",()=>{const restored=deserializeGraphicsDocument(serializeGraphicsDocument(doc));expect(restored).toEqual(doc);});
 it("preserves viewport overrides",()=>{const r=deserializeGraphicsDocument(serializeGraphicsDocument(doc));expect(r.layers[0].viewportOverrides?.v).toEqual({visible:false,x:10});});
 it("preserves world/view/output references",()=>{const r=deserializeGraphicsDocument(serializeGraphicsDocument(doc));expect(r.worlds3d?.[0].id).toBe("w");expect(r.outputs?.[0].viewportId).toBe("v");});
 it("preserves animation and timeline state",()=>{const d={...doc,timeline:{...doc.timeline!,tracks:[{id:"t",layerId:"a",targetId:"a",property:"x",keyframes:[{id:"k",time:1,value:50}]}]}};const r=deserializeGraphicsDocument(serializeGraphicsDocument(d));expect(r.timeline?.tracks[0].keyframes[0].value).toBe(50);});
});
