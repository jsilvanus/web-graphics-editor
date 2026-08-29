import {describe,expect,it} from "vitest";
import {resolveComposition,resolveOutput,resolveScene,resolveViewportComposition,sceneAtTime} from "./presentation";
import {baseDocument} from "./test-fixtures";

describe("presentation hierarchy",()=>{
 it("resolves composition to ordered layers",()=>{const d=baseDocument();expect(resolveComposition(d,"all")?.layers.map(l=>l.id)).toEqual(["background","title","lyrics"]);});
 it("applies per-viewport visibility and geometry",()=>{const d=baseDocument();d.layers[1].viewportOverrides={venue:{visible:false,x:50}};const r=resolveViewportComposition(d,"venue","all");expect(r?.layers[1].visible).toBe(false);expect(r?.layers[1].x).toBe(50);});
 it("keeps source document immutable during resolution",()=>{const d=baseDocument();d.layers[1].viewportOverrides={venue:{visible:false}};resolveViewportComposition(d,"venue","all");expect(d.layers[1].visible).toBeUndefined();});
 it("selects scene by main timeline time",()=>{const d=baseDocument();d.timeline!.scenes.push({id:"second",name:"Second",compositionId:"all",start:5,duration:5});expect(sceneAtTime(d.timeline,6)?.id).toBe("second");expect(resolveScene(d,6,"broadcast")?.localTime).toBe(1);});
 it("resolves output through viewport and active scene",()=>{const d=baseDocument();const r=resolveOutput(d,"out",1);expect(r).toBeDefined();expect(r && "layers" in r ? r.layers.length : 0).toBe(3);});
});
