import { describe, expect, it } from "vitest";
import { editWorldPropertyAtTime } from "./world-keyframe-edit";
import type { Graphics3DWorld } from "./types";

const world: Graphics3DWorld = { id:"w", meshes:[{id:"m",geometry:{vertices:[],indices:[]},transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}}], cameras:[] };

describe("editWorldPropertyAtTime", () => {
  it("creates a track and keyframe when editing an unanimated property", () => {
    const r=editWorldPropertyAtTime(world,"mesh","m","rotationY",2,90);
    expect(r.created).toBe(true); expect(r.world.timeline?.tracks).toHaveLength(1);
    expect(r.world.timeline?.tracks[0].keyframes[0]).toMatchObject({time:2,value:90});
  });
  it("updates the existing keyframe instead of creating another", () => {
    const a=editWorldPropertyAtTime(world,"mesh","m","rotationY",2,90);
    const b=editWorldPropertyAtTime(a.world,"mesh","m","rotationY",2,120);
    expect(b.created).toBe(false); expect(b.world.timeline?.tracks[0].keyframes).toHaveLength(1); expect(b.world.timeline?.tracks[0].keyframes[0].value).toBe(120);
  });
  it("creates a new keyframe at a different world time", () => {
    const a=editWorldPropertyAtTime(world,"mesh","m","rotationY",2,90);
    const b=editWorldPropertyAtTime(a.world,"mesh","m","rotationY",4,180);
    expect(b.world.timeline?.tracks[0].keyframes.map(k=>k.time)).toEqual([2,4]);
  });
});
