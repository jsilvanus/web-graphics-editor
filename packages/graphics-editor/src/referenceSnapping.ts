import type { Layer } from "./types";

export type ReferenceSnapMode = "edges" | "centers" | "size" | "angle" | "spacing";
export interface ReferenceSnapOptions { edges?: boolean; centers?: boolean; size?: boolean; angle?: boolean; spacing?: boolean; threshold?: number }
export interface ReferenceSnapResult { x:number; y:number; rotation?:number; snappedX:boolean; snappedY:boolean; snappedRotation:boolean; guideX?:number; guideY?:number }

const edgeValues=(l:Layer)=>({left:l.x,centerX:l.x+l.width/2,right:l.x+l.width,top:l.y,centerY:l.y+l.height/2,bottom:l.y+l.height});

export function referenceSnap(moving:Layer, reference:Layer, options:ReferenceSnapOptions={}):ReferenceSnapResult {
 const threshold=options.threshold??10, a=edgeValues({...moving}), r=edgeValues(reference); let x=moving.x,y=moving.y,rotation:number|undefined; let snappedX=false,snappedY=false,snappedRotation=false; let bestX=threshold,bestY=threshold;
 if(options.edges!==false){for(const ma of [a.left,a.centerX,a.right])for(const ra of [r.left,r.centerX,r.right]){const d=Math.abs(ma-ra);if(d<bestX){bestX=d;x+=ra-ma;snappedX=true}}for(const ma of [a.top,a.centerY,a.bottom])for(const ra of [r.top,r.centerY,r.bottom]){const d=Math.abs(ma-ra);if(d<bestY){bestY=d;y+=ra-ma;snappedY=true}}}
 if(options.centers){const dx=Math.abs(a.centerX-r.centerX),dy=Math.abs(a.centerY-r.centerY);if(dx<bestX){x+=r.centerX-a.centerX;snappedX=true}if(dy<bestY){y+=r.centerY-a.centerY;snappedY=true}}
 if(options.size){if(Math.abs(moving.width-reference.width)<threshold) x=moving.x+(reference.width-moving.width)/2;if(Math.abs(moving.height-reference.height)<threshold)y=moving.y+(reference.height-moving.height)/2}
 if(options.angle!==false&&moving.rotation!==undefined&&reference.rotation!==undefined){const delta=reference.rotation-moving.rotation;if(Math.abs(delta)<=threshold) {rotation=reference.rotation;snappedRotation=true}}
 return{x,y,rotation,snappedX,snappedY,snappedRotation,guideX:snappedX?reference.x+reference.width/2:undefined,guideY:snappedY?reference.y+reference.height/2:undefined};
}

export function referenceGuides(reference:Layer):{vertical:number[];horizontal:number[]} {const e=edgeValues(reference);return{vertical:[e.left,e.centerX,e.right],horizontal:[e.top,e.centerY,e.bottom]};}
