import { describe, expect, it } from "vitest";
import { interpolateKeyframes, evaluateTrack } from "./animation";

describe("animation edge cases",()=>{
 const k=(time:number,value:number,interpolation?:any)=>({id:`k${time}`,time,value,interpolation});
 it("clamps before and after keyframes",()=>{const ks=[k(1,10),k(3,30)];expect(interpolateKeyframes(ks,0)).toBe(10);expect(interpolateKeyframes(ks,4)).toBe(30);});
 it("returns exact values at keyframes",()=>{const ks=[k(0,0),k(1,100)];expect(interpolateKeyframes(ks,0)).toBe(0);expect(interpolateKeyframes(ks,1)).toBe(100);});
 it("handles coincident keyframe times deterministically",()=>{const ks=[k(1,10),k(1,20)];expect(interpolateKeyframes(ks,1)).toBe(20);});
 it("handles a single keyframe",()=>expect(interpolateKeyframes([k(2,42)],999)).toBe(42));
 it("does not produce NaN for zero-length intervals",()=>{const v=interpolateKeyframes([k(0,1),k(0,2)],0);expect(Number.isNaN(v as number)).toBe(false);});
 it("supports linear easing",()=>expect(interpolateKeyframes([k(0,0),k(10,100)],5)).toBeCloseTo(50));
 it("evaluates a track at arbitrary time",()=>{const track:any={id:"t",targetId:"a",property:"x",keyframes:[k(0,0),k(2,20)]};expect(evaluateTrack(track,1)).toBeCloseTo(10);});
});
