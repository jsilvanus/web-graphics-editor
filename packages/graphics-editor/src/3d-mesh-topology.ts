import type { Graphics3DMesh } from "./types";

type Vec3 = [number, number, number];
const v=(g:Graphics3DMesh["geometry"],i:number):Vec3=>[g.vertices[i*3],g.vertices[i*3+1],g.vertices[i*3+2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a:Vec3,n:number):Vec3=>[a[0]*n,a[1]*n,a[2]*n];
const len=(a:Vec3)=>Math.hypot(...a);
const norm=(a:Vec3):Vec3=>{const n=len(a);return n>1e-8?mul(a,1/n):[0,1,0]};

export interface MeshEdge { a:number;b:number;faces:number[] }
export function meshEdges(mesh:Graphics3DMesh):MeshEdge[]{const map=new Map<string,MeshEdge>();for(let f=0;f<mesh.geometry.indices.length/3;f++){const ids=[mesh.geometry.indices[f*3],mesh.geometry.indices[f*3+1],mesh.geometry.indices[f*3+2]];for(let i=0;i<3;i++){const a=ids[i],b=ids[(i+1)%3],lo=Math.min(a,b),hi=Math.max(a,b),key=`${lo}:${hi}`;const e=map.get(key)??{a:lo,b:hi,faces:[]};if(!e.faces.includes(f))e.faces.push(f);map.set(key,e)}}return [...map.values()]}
export function edgeKey(a:number,b:number){return `${Math.min(a,b)}:${Math.max(a,b)}`}
export function edgeMidpoint(mesh:Graphics3DMesh,e:MeshEdge):Vec3{return mul(add(v(mesh.geometry,e.a),v(mesh.geometry,e.b)),.5)}
export function insetFace(mesh:Graphics3DMesh,face:number,amount:number):Graphics3DMesh{const i=face*3;if(i+2>=mesh.geometry.indices.length)return mesh;const ids=[mesh.geometry.indices[i],mesh.geometry.indices[i+1],mesh.geometry.indices[i+2]];const verts=[...mesh.geometry.vertices],center=mul(add(add(v(mesh.geometry,ids[0]),v(mesh.geometry,ids[1])),v(mesh.geometry,ids[2])),1/3);const inner=ids.map(id=>{const p=v(mesh.geometry,id),q=add(p,mul(sub(center,p),Math.max(0,Math.min(1,amount))));verts[id*3]=q[0];verts[id*3+1]=q[1];verts[id*3+2]=q[2];return id});return{...mesh,geometry:{...mesh.geometry,vertices:verts,indices:[...mesh.geometry.indices]}}}
export function bevelEdges(mesh:Graphics3DMesh,keys:Set<string>,amount:number):Graphics3DMesh{const verts=[...mesh.geometry.vertices];for(const e of meshEdges(mesh)){if(!keys.has(edgeKey(e.a,e.b)))continue;const a=v(mesh.geometry,e.a),b=v(mesh.geometry,e.b),d=norm(sub(b,a));const pa=add(a,mul(d,amount)),pb=add(b,mul(d,-amount));verts[e.a*3]=pa[0];verts[e.a*3+1]=pa[1];verts[e.a*3+2]=pa[2];verts[e.b*3]=pb[0];verts[e.b*3+1]=pb[1];verts[e.b*3+2]=pb[2]}return{...mesh,geometry:{...mesh.geometry,vertices:verts}}}
