import {describe,expect,it} from "vitest";
import {buildArcLengthTable,evaluateConstantSpeedBezier,parameterAtArcLength} from "./spatial-interpolation";

describe("constant-speed spatial interpolation",()=>{
 const curve={p0:[0,0,0] as const,p1:[0,100,0] as const,p2:[100,100,0] as const,p3:[100,0,0] as const};
 it("maps endpoints correctly",()=>{expect(evaluateConstantSpeedBezier(curve,0)).toEqual([0,0,0]);expect(evaluateConstantSpeedBezier(curve,1)).toEqual([100,0,0])});
 it("produces monotonic arc-length parameters",()=>{let previous=0;for(let i=0;i<=10;i++){const t=parameterAtArcLength(curve,i/10);expect(t).toBeGreaterThanOrEqual(previous);previous=t}});
 it("keeps equal-distance samples approximately equally spaced",()=>{const points=Array.from({length:11},(_,i)=>evaluateConstantSpeedBezier(curve,i/10));const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1],p[2]-points[i][2]));const mean=distances.reduce((a,b)=>a+b,0)/distances.length;expect(Math.max(...distances)-Math.min(...distances)).toBeLessThan(mean*.08)});
 it("builds a non-zero arc-length table",()=>{expect(buildArcLengthTable(curve).at(-1)!.length).toBeGreaterThan(0)});
});
