import {describe,expect,it} from "vitest";
import {evaluateAnimationKeyframes,interpolateAnimationValue,interpolateSpatial} from "./animation";

describe("animation engine",()=>{
 it("interpolates opacity",()=>expect(interpolateAnimationValue(0,1,.5)).toBe(.5));
 it("applies outgoing easing",()=>expect(interpolateAnimationValue(0,100,.5,{easing:{mode:"ease-in"}})).toBe(25));
 it("interpolates color",()=>expect(interpolateAnimationValue("#ff0000","#000000",.5)).toBe("#800000"));
 it("supports discrete values",()=>expect(interpolateAnimationValue("red","black",.5,{mode:"discrete"})).toBe("red"));
 it("evaluates keyframes at arbitrary time",()=>expect(evaluateAnimationKeyframes([{id:"a",time:0,value:0},{id:"b",time:2,value:20}],1)).toBe(10));
 it("supports constant-speed cubic spatial interpolation",()=>{const p=interpolateSpatial([0,0,0],[10,0,0],.5,{mode:"cubic-bezier",constantSpeed:true,path:{type:"cubic-bezier",from:[0,0,0],control1:[0,10,0],control2:[10,10,0],to:[10,0,0]}});expect(p[0]).toBeGreaterThan(0);expect(p[0]).toBeLessThan(10);});
});
