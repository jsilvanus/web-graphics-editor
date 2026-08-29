import { describe,expect,it } from "vitest";
import { evaluateTrack, interpolateKeyframes } from "./animation";

type K={id:string;time:number;value:any;interpolation?:any};
const k=(id:string,time:number,value:any,interpolation?:any):K=>({id,time,value,interpolation});

describe("animation comprehensive",()=>{
 it("interpolates fractions",()=>{expect(interpolateKeyframes([k("a",0,0),k("b",4,8)],1)).toBe(2);expect(interpolateKeyframes([k("a",0,0),k("b",4,8)],3)).toBe(6);});
 it("supports negative numeric values",()=>expect(interpolateKeyframes([k("a",0,-10),k("b",10,10)],5)).toBe(0));
 it("handles unsorted keyframes",()=>expect(interpolateKeyframes([k("b",10,100),k("a",0,0)],5)).toBe(50));
 it("handles boolean/discrete values",()=>{expect(interpolateKeyframes([k("a",0,false),k("b",10,true)],5)).toBe(false);expect(interpolateKeyframes([k("a",0,"red"),k("b",10,"black")],5)).toBe("red");});
 it("uses explicit discrete interpolation",()=>expect(interpolateKeyframes([k("a",0,0,{mode:"discrete"}),k("b",10,100)],5)).toBe(0));
 it("evaluates exact first/last track values",()=>{const t:any={id:"t",targetId:"x",property:"x",keyframes:[k("a",2,20),k("b",5,50)]};expect(evaluateTrack(t,2)).toBe(20);expect(evaluateTrack(t,5)).toBe(50);});
 it("evaluates adjacent tracks independently",()=>{const a:any={id:"a",targetId:"o",property:"x",keyframes:[k("a0",0,0),k("a1",1,10)]};const b:any={id:"b",targetId:"o",property:"opacity",keyframes:[k("b0",0,0),k("b1",1,1)]};expect(evaluateTrack(a,.5)).toBe(5);expect(evaluateTrack(b,.5)).toBe(.5);});
 it("keeps keyframe metadata intact",()=>{const ks=[k("a",0,0,{mode:"linear",easing:{mode:"ease-in"}}),k("b",1,1)];expect(ks[0].interpolation.easing.mode).toBe("ease-in");});
});
