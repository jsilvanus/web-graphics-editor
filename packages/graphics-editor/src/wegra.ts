import type { GraphicsDocument } from "./types";
import type { ActorVocabulary } from "./history/operations";
import type { DocumentHistory } from "./history/store";

export interface WegraManifest {
  format: "wegra";
  version: 1;
  document: "document.json";
  history: boolean;
  provenance: "provenance/actors.json";
}

export interface WegraProject {
  document: GraphicsDocument;
  history?: DocumentHistory;
  actors?: ActorVocabulary;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc^0xffffffff)>>>0;
}

function u16(n:number){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n:number){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function concat(...parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function zip(files:{name:string;data:Uint8Array}[]) {
  const locals:Uint8Array[]=[]; const central:Uint8Array[]=[]; let offset=0;
  for(const f of files){const name=encoder.encode(f.name),crc=crc32(f.data);const h=concat(new Uint8Array([80,75,3,4]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(f.data.length),u32(f.data.length),u16(name.length),u16(0),name);locals.push(concat(h,f.data));const c=concat(new Uint8Array([80,75,1,2]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(f.data.length),u32(f.data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name);central.push(c);offset+=h.length+f.data.length}
  const body=concat(...locals),cd=concat(...central);const end=concat(new Uint8Array([80,75,5,6]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cd.length),u32(body.length),u16(0));return concat(body,cd,end);
}

export function serializeWegra(project: WegraProject): Uint8Array {
  const manifest: WegraManifest={format:"wegra",version:1,document:"document.json",history:!!project.history,provenance:"provenance/actors.json"};
  const files=[{name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},{name:"document.json",data:encoder.encode(JSON.stringify(project.document,null,2))},{name:"provenance/actors.json",data:encoder.encode(JSON.stringify(project.actors??{actors:{}},null,2))}];
  if(project.history){files.push({name:"history/history.json",data:encoder.encode(JSON.stringify(project.history,null,2))})}
  return zip(files);
}

export function deserializeWegra(bytes: Uint8Array): WegraProject {
  // Minimal ZIP reader for the store-only ZIP files produced above.
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), files:Record<string,Uint8Array>={};
  let p=0;
  while(p+4<=bytes.length){const sig=view.getUint32(p,true);if(sig===0x04034b50){const nameLen=view.getUint16(p+26,true),extraLen=view.getUint16(p+28,true),size=view.getUint32(p+18,true),name=decoder.decode(bytes.slice(p+30,p+30+nameLen));const start=p+30+nameLen+extraLen;files[name]=bytes.slice(start,start+size);p=start+size}else if(sig===0x06054b50)break;else p++}
  const manifest=JSON.parse(decoder.decode(files["manifest.json"]??new Uint8Array())) as WegraManifest;if(manifest.format!=="wegra"||manifest.version!==1)throw new Error("Unsupported .wegra format");
  return {document:JSON.parse(decoder.decode(files["document.json"])) as GraphicsDocument,actors:JSON.parse(decoder.decode(files["provenance/actors.json"]??encoder.encode('{"actors":{}}'))) as ActorVocabulary,history:manifest.history&&files["history/history.json"]?JSON.parse(decoder.decode(files["history/history.json"])) as DocumentHistory:undefined};
}
