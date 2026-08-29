import {describe,expect,it} from "vitest";
import {evaluateAnimationKeyframes,interpolateAnimationValue,interpolateSpatial} from "./animation";

describe("animation primitives",()=>{
 it("handles empty and boundary keyframes",()=>{expect(evaluateAnimationKeyframes([],1)).toBeUndefined();const k=[{id:"a",time:2,value:4},{id:"b",time:8,value:12}];expect(evaluateAnimationKeyframes(k,0)).toBe(4);expect(evaluateAnimationKeyframes(k,20)).toBe(12);});
 it("sorts keyframes",()=>expect(evaluateAnimationKeyframes([{id:"b",time:10,value:10},{id:"a",time:0,value:0}],5)).toBe(5));
 it("interpolates numbers and tuples",()=>{expect(interpolateAnimationValue(0,10,.5)).toBe(5);expect(interpolateAnimationValue([0,10,20],[10,20,30],.5)).toEqual([5,15,25]);});
 it("supports easing",()=>{expect(interpolateAnimationValue(0,10,.5,{easing:{mode:"ease-in"}})).toBe(2.5);expect(interpolateAnimationValue(0,10,.5,{easing:{mode:"ease-out"}})).toBe(7.5);});
 it("supports cubic bezier easing",()=>{const v=interpolateAnimationValue(0,1,.5,{easing:{mode:"cubic-bezier",bezier:[.42,0,.58,1]}}) as number;expect(v).toBeCloseTo(.5,3);});
 it("supports discrete values",()=>{expect(interpolateAnimationValue(false,true,.5,{mode:"discrete"})).toBe(false);expect(interpolateAnimationValue(false,true,1,{mode:"discrete"})).toBe(true);});
 it("interpolates colors",()=>{expect(interpolateAnimationValue("#ff0000","#000000",.5)).toBe("#800000");expect(interpolateAnimationValue("#ff0000","#000000",.5,{colorSpace:"oklab"})).toMatch(/^#/);});
 it("falls back for incompatible values",()=>expect(interpolateAnimationValue("hello","world",.5)).toBe("hello"));
 it("supports cubic spatial paths",()=>{const p=interpolateSpatial([0,0,0],[10,0,0],.5,{mode:"cubic-bezier",path:{type:"cubic-bezier",from:[0,0,0],control1:[0,10,0],control2:[10,10,0],to:[10,0,0]}});expect(p[0]).toBe(5);expect(p[1]).toBe(7.5);});
});
