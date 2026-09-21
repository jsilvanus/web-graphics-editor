import type { PathNode } from "../types";
import { flattenPathNodes } from "../geometry";

export type BooleanOperation = "union" | "intersect" | "subtract";
export type PolygonPoint = { x:number; y:number };
export interface BooleanContour { points: PolygonPoint[]; hole: boolean; }
type Node={p:PolygonPoint;next:Node;prev:Node;intersection:boolean;alpha:number;neighbor?:Node;entry?:boolean;visited?:boolean};
const EPS=1e-7;
const same=(a:PolygonPoint,b:PolygonPoint)=>Math.abs(a.x-b.x)<EPS&&Math.abs(a.y-b.y)<EPS;
const area=(p:PolygonPoint[])=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-a.y*b.x},0)/2;
const inside=(p:PolygonPoint,poly:PolygonPoint[])=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>p.y)!==(b.y>p.y))&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c}return c};
function hit(a:PolygonPoint,b:PolygonPoint,c:PolygonPoint,d:PolygonPoint){const den=(a.x-b.x)*(c.y-d.y)-(a.y-b.y)*(c.x-d.x);if(Math.abs(den)<EPS)return null;const t=((a.x-c.x)*(c.y-d.y)-(a.y-c.y)*(c.x-d.x))/den;const u=-((a.x-b.x)*(a.y-c.y)-(a.y-b.y)*(a.x-c.x))/den;if(t<-EPS||t>1+EPS||u<-EPS||u>1+EPS)return null;return {p:{x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)},t,u}};
function ring(poly:PolygonPoint[]){const n=poly.map(p=>({p:{...p},intersection:false,alpha:0} as Partial<Node>));n.forEach((x,i)=>{x.next=n[(i+1)%n.length] as Node;x.prev=n[(i+n.length-1)%n.length] as Node});return n as Node[]}
function insert(edge:Node,n:Node){let cur=edge;while(cur.next!==edge&&cur.next.intersection&&cur.next.alpha<n.alpha)cur=cur.next;n.next=cur.next;n.prev=cur;cur.next.prev=n;cur.next=n}
function fallback(a:PolygonPoint[],b:PolygonPoint[],op:BooleanOperation):BooleanContour[]{const ai=inside(b[0],a),bi=inside(a[0],b);if(op==="intersect")return ai?[{points:b,hole:false}]:bi?[{points:a,hole:false}]:[];if(op==="union")return ai?[{points:a,hole:false}]:bi?[{points:b,hole:false}]:[{points:a,hole:false},{points:b,hole:false}];if(ai)return [{points:a,hole:false},{points:b,hole:true}];return [{points:a,hole:false}]}
export function booleanContours(a:PolygonPoint[],b:PolygonPoint[],op:BooleanOperation):BooleanContour[] {
 if(a.length<3||b.length<3)return [];
 const A=ring(a),B=ring(b);let count=0;
 for(const x of A)for(const y of B){const h=hit(x.p,x.next.p,y.p,y.next.p);if(!h)continue;const an={p:h.p,intersection:true,alpha:h.t} as Node,bn={p:h.p,intersection:true,alpha:h.u} as Node;an.neighbor=bn;bn.neighbor=an;insert(x,an);insert(y,bn);count++}
 if(!count)return fallback(a,b,op);
 for(const n of A)if(n.intersection){const q={x:n.p.x+(n.next.p.x-n.p.x)*1e-6,y:n.p.y+(n.next.p.y-n.p.y)*1e-6};const other=inside(q,b);n.entry=op==="intersect"?other:op==="union"?!other:other}
 for(const n of B)if(n.intersection){const q={x:n.p.x+(n.next.p.x-n.p.x)*1e-6,y:n.p.y+(n.next.p.y-n.p.y)*1e-6};const other=inside(q,a);n.entry=op==="intersect"?other:op==="union"?!other:other}
 const result:BooleanContour[]=[];
 for(const start of [...A,...B])if(start.intersection&&!start.visited&&start.entry){const out=[];let n=start,guard=0;do{n.visited=true;out.push(n.p);if(n.intersection&&n.neighbor){n=n.neighbor;if(n.visited)break}n=n.next;guard++}while(n!==start&&guard<10000);if(out.length>2&&Math.abs(area(out))>EPS)result.push({points:out,hole:false})}
 return result.length?result:fallback(a,b,op);
}
export function booleanPolygons(a:PolygonPoint[],b:PolygonPoint[],op:BooleanOperation):PolygonPoint[][] {
 return booleanContours(a,b,op).map(contour=>contour.points);
}
export function pathNodesToPolygon(nodes:PathNode[],closed=true,tolerance=0.75):PolygonPoint[]|null {
 if(nodes.length<3||!closed)return null;
 return flattenPathNodes(nodes,closed,tolerance).points;
}
export function polygonToPathNodes(poly:PolygonPoint[]):PathNode[]{return poly.map(p=>({x:p.x,y:p.y,kind:"corner"}));}
