export type Vec3 = readonly [number, number, number];

export interface CubicBezier3D { p0: Vec3; p1: Vec3; p2: Vec3; p3: Vec3 }

const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const point=(c:CubicBezier3D,t:number):Vec3=>{const u=1-t,uu=u*u,tt=t*t;return [uu*u*c.p0[0]+3*uu*t*c.p1[0]+3*u*tt*c.p2[0]+tt*t*c.p3[0],uu*u*c.p0[1]+3*uu*t*c.p1[1]+3*u*tt*c.p2[1]+tt*t*c.p3[1],uu*u*c.p0[2]+3*uu*t*c.p1[2]+3*u*tt*c.p2[2]+tt*t*c.p3[2]]};
const dist=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

/** Builds an arc-length lookup table. Increasing resolution improves constant-speed accuracy. */
export function buildArcLengthTable(curve:CubicBezier3D,resolution=256){const table=[{t:0,length:0}],prev=point(curve,0);let length=0;for(let i=1;i<=resolution;i++){const t=i/resolution,p=point(curve,t);length+=dist(prev,p);table.push({t,length});prev=p}return table}

export function bezierLength(curve:CubicBezier3D,resolution=256){return buildArcLengthTable(curve,resolution).at(-1)!.length}

/** Maps normalized distance along a cubic Bezier to its curve parameter t. */
export function parameterAtArcLength(curve:CubicBezier3D,distance:number,resolution=256){const table=buildArcLengthTable(curve,resolution);const total=table.at(-1)!.length;if(total<=0)return 0;const target=Math.max(0,Math.min(1,distance))*total;let hi=table.findIndex(x=>x.length>=target);if(hi<=0)return 0;if(hi<0)hi=table.length-1;const a=table[hi-1],b=table[hi];const f=b.length===a.length?0:(target-a.length)/(b.length-a.length);return lerp(a.t,b.t,f)}

/** Evaluates a cubic Bezier by normalized arc length, giving approximately constant spatial speed. */
export function evaluateConstantSpeedBezier(curve:CubicBezier3D,distance:number,resolution=256):Vec3{return point(curve,parameterAtArcLength(curve,distance,resolution))}
