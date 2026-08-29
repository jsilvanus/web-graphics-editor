import { describe, expect, it } from "vitest";
import { createOutputRuntime, dispatchOutputRuntime, outputTransitionProgress, takeOffOutput, takeOutput, tickOutputRuntime } from "./outputs-runtime";
import type { GraphicsOutput } from "./types";

const output=(overrides:Partial<GraphicsOutput>={})=>({id:"o1",name:"Test",playback:"live",background:"transparent",editable:true,liveControl:true,defaultTime:0,loop:false,duration:10,inTransition:{type:"fade",duration:1},outTransition:{type:"fade",duration:.5},createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z",...overrides} as GraphicsOutput);

describe("output runtime",()=>{
 it("starts live outputs off and non-live outputs on",()=>{expect(createOutputRuntime(output()).state).toBe("off");expect(createOutputRuntime(output({playback:"automatic"})).state).toBe("on")});
 it("takes on with an in transition",()=>{const o=output();let r=takeOutput(createOutputRuntime(o),o);expect(r.state).toBe("entering");r=tickOutputRuntime(r,o,.4);expect(r.state).toBe("entering");expect(outputTransitionProgress(r,o)).toBeCloseTo(.4);r=tickOutputRuntime(r,o,.6);expect(r.state).toBe("on");expect(outputTransitionProgress(r,o)).toBe(1)});
 it("takes off with an out transition",()=>{const o=output();let r={...createOutputRuntime(o),state:"on" as const};r=takeOffOutput(r,o);expect(r.state).toBe("exiting");r=tickOutputRuntime(r,o,.5);expect(r.state).toBe("off")});
 it("supports immediate transitions",()=>{const o=output({inTransition:undefined,outTransition:undefined});let r=takeOutput(createOutputRuntime(o),o);expect(r.state).toBe("on");r=takeOffOutput(r,o);expect(r.state).toBe("off")});
 it("advances playing output time and loops",()=>{const o=output({duration:2,loop:true});let r={...createOutputRuntime(o),state:"on" as const,time:1.75};r=dispatchOutputRuntime(r,o,{type:"TICK",delta:.5});expect(r.time).toBeCloseTo(.25)});
 it("does not advance a paused/static runtime",()=>{const o=output({playback:"static"});let r={...createOutputRuntime(o),state:"on" as const,time:1};r=dispatchOutputRuntime(r,o,{type:"TICK",delta:2});expect(r.time).toBe(1)});
 it("rejects TAKE when live control is disabled",()=>{const o=output({liveControl:false});const r=takeOutput(createOutputRuntime(o),o);expect(r.state).toBe("off")});
 it("handles controller-style command dispatch",()=>{const o=output();let r=createOutputRuntime(o);r=dispatchOutputRuntime(r,o,{type:"TAKE"});expect(r.state).toBe("entering");r=dispatchOutputRuntime(r,o,{type:"TICK",delta:1});expect(r.state).toBe("on");r=dispatchOutputRuntime(r,o,{type:"TAKE_OFF"});expect(r.state).toBe("exiting")});
});
