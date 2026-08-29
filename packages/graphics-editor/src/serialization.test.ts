import {describe,expect,it} from "vitest";
import {deserializeGraphicsDocument,GRAPHICS_DOCUMENT_VERSION,serializeGraphicsDocument} from "./serialization";
import {baseDocument} from "./test-fixtures";

describe("document serialization",()=>{
 it("writes the current version",()=>expect(JSON.parse(serializeGraphicsDocument(baseDocument())).version).toBe(GRAPHICS_DOCUMENT_VERSION));
 it("round-trips the architectural collections",()=>{const doc=baseDocument();const out=deserializeGraphicsDocument(serializeGraphicsDocument(doc));expect(out.compositions).toEqual(doc.compositions);expect(out.viewports).toEqual(doc.viewports);expect(out.timeline).toEqual(doc.timeline);expect(out.outputs).toEqual(doc.outputs);});
 it("round-trips layer hierarchy and viewport overrides",()=>{const doc=baseDocument();doc.layers[1].parentId="background";doc.layers[1].viewportOverrides={venue:{visible:false,x:20}};const out=deserializeGraphicsDocument(serializeGraphicsDocument(doc));expect(out.layers[1].parentId).toBe("background");expect(out.layers[1].viewportOverrides?.venue).toEqual({visible:false,x:20});});
 it("normalizes legacy rect layers",()=>{const out=deserializeGraphicsDocument(JSON.stringify({width:100,height:100,layers:[{id:"r",type:"rect",x:0,y:0,width:10,height:10}]}));expect(out.layers[0].type).toBe("rectangle");});
 it("rejects malformed documents",()=>{expect(()=>deserializeGraphicsDocument(JSON.stringify({width:100,height:100}))).toThrow("Invalid graphics document shape");expect(()=>deserializeGraphicsDocument("null")).toThrow("Invalid graphics document shape");});
});
