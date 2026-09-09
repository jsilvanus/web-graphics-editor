import { describe, expect, it } from "vitest";
import type { GraphicsDocument } from "./types";
import { assertValidDocumentReferences, validateDocumentReferences } from "./validate-references";

const base=():GraphicsDocument=>({
  width:1920,height:1080,
  layers:[
    {id:"bg",type:"rectangle",x:0,y:0,width:1920,height:1080},
    {id:"title",type:"text",x:10,y:10,width:500,height:50,text:"Hello",textStyle:{fontAssetId:"font"}},
    {id:"view-layer",type:"3d-view",x:0,y:0,width:500,height:300,view3dId:"view"}
  ],
  compositions:[{id:"main",name:"Main",layerIds:["bg","title","view-layer"]}],
  viewports:[{id:"program",name:"Program",width:1920,height:1080,compositionIds:["main"]}],
  assets:[{id:"font",name:"Inter",url:"data:font/woff2;base64,AA==",type:"font"},{id:"texture",name:"Texture",url:"data:image/png;base64,AA==",type:"image"}],
  worlds3d:[{id:"world",meshes:[{id:"mesh",geometry:{vertices:[0,0,0,1,0,0,0,1,0],indices:[0,1,2]},transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]},material:{textureAssetId:"texture"}}],cameras:[{id:"camera",position:[0,0,5],rotation:[0,0,0],projection:"perspective"}],timeline:{tracks:[{id:"track",targetType:"mesh",targetId:"mesh",property:"positionX",keyframes:[{id:"key",time:0,value:0}]}]}}],
  views3d:[{id:"view",worldId:"world",cameraId:"camera",renderAssetId:"render",x:0,y:0,width:500,height:300}],
  timeline:{scenes:[{id:"scene",name:"Scene",compositionId:"main",start:0,duration:10}],currentSceneId:"scene",currentTime:0,tracks:[{id:"layer-track",layerId:"title",property:"x",keyframes:[{id:"key",time:0,value:0}]}],clips:[{id:"clip",layerId:"title",start:0,duration:10}]},
  outputs:[{id:"output",name:"Output",viewportId:"program",playback:"static",background:"opaque"}]
});

describe("document reference integrity",()=>{
  it("accepts a fully connected document",()=>{
    const result=validateDocumentReferences(base());
    expect(result).toEqual({valid:true,errors:[]});
    expect(()=>assertValidDocumentReferences(base())).not.toThrow();
  });

  it("reports dangling 2D hierarchy and asset references",()=>{
    const d=base();
    d.layers[1].textStyle={fontAssetId:"missing-font"};
    d.layers[2].view3dId="missing-view";
    d.compositions![0].layerIds.push("missing-layer");
    const result=validateDocumentReferences(d);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'layer "title" fontAssetId references missing id "missing-font"',
      'layer "view-layer" view3dId references missing id "missing-view"',
      'composition "main" layerIds references missing id "missing-layer"'
    ]));
  });

  it("reports dangling timeline, viewport, output and 3D references",()=>{
    const d=base();
    d.viewports![0].compositionIds=["missing-composition"];
    d.timeline!.scenes[0].compositionId="missing-composition";
    d.timeline!.tracks[0].layerId="missing-layer";
    d.timeline!.clips![0].layerId="missing-layer";
    d.views3d![0].worldId="missing-world";
    d.worlds3d![0].timeline!.tracks[0].targetId="missing-mesh";
    d.outputs![0].viewportId="missing-viewport";
    const result=validateDocumentReferences(d);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(7);
  });

  it("validates 3D camera and texture asset references",()=>{
    const d=base();
    d.views3d![0].cameraId="missing-camera";
    d.worlds3d![0].meshes[0].material!.textureAssetId="missing-texture";
    const result=validateDocumentReferences(d);
    expect(result.errors).toEqual(expect.arrayContaining([
      '3D view "view" cameraId references missing id "missing-camera"',
      'world "world" mesh "mesh" textureAssetId references missing id "missing-texture"'
    ]));
  });

  it("reports duplicate IDs and incompatible asset types",()=>{
    const d=base();
    d.assets!.push({id:"font",name:"Other",url:"x",type:"image"});
    d.layers[1].textStyle!.fontAssetId="texture";
    const result=validateDocumentReferences(d);
    expect(result.errors).toEqual(expect.arrayContaining([
      'assets contains duplicate id "font"',
      'layer "title" fontAssetId "texture" is not a font asset'
    ]));
  });
});
