import type { WorldTimeMapping } from "./types";

/** Map WEGRA/main-timeline time to the local time of a referenced 3D world. */
export function mapWorldTime(wegraTime:number,mapping:WorldTimeMapping):number{
 const raw=mapping.offset+wegraTime*mapping.rate;
 const inPoint=mapping.inPoint??0;
 const outPoint=mapping.outPoint;
 if(!mapping.loop||outPoint===undefined||outPoint<=inPoint)return raw;
 const length=outPoint-inPoint;
 return inPoint+((((raw-inPoint)%length)+length)%length);
}
