import type { Composition, Graphics3DView, MediaTimeMapping, WorldTimeMapping } from "./types";

export function compositionTime(time:number, composition:Composition):number {
  const t=Number.isFinite(time)?Math.max(0,time):0;
  const duration=composition.duration;
  if(!duration||duration<=0)return t;
  return composition.loop?t%duration:Math.min(t,duration);
}

export function mapMediaTime(compositionTimeValue:number,mapping:MediaTimeMapping):number {
  const rate=Number.isFinite(mapping.rate)?mapping.rate:1;
  const raw=mapping.offset+compositionTimeValue*rate;
  const start=mapping.inPoint??0;
  const end=mapping.outPoint;
  if(end!==undefined&&end>start&&mapping.loop) {
    const span=end-start;
    return start+(((raw-start)%span)+span)%span;
  }
  return Math.max(start,end!==undefined?Math.min(raw,end):raw);
}

export function mapWorldTime(compositionTimeValue:number,mapping:WorldTimeMapping):number {
  return mapMediaTime(compositionTimeValue,mapping);
}

export function map3DViewTime(compositionTimeValue:number,view:Graphics3DView):number {
  return mapWorldTime(compositionTimeValue,view.worldTime??{offset:0,rate:1});
}
