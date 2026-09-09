import type { GraphicsDocument } from "./types";

export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
}

const ids = <T extends {id:string}>(items:T[]|undefined):Map<string,T> => new Map((items ?? []).map(item => [item.id,item]));

function duplicateIds<T extends {id:string}>(items:T[]|undefined, label:string, errors:string[]):void {
  const seen=new Set<string>();
  for (const item of items ?? []) {
    if (seen.has(item.id)) errors.push(`${label} contains duplicate id "${item.id}"`);
    seen.add(item.id);
  }
}

function requireReference(map:Map<string,unknown>, id:string, path:string, errors:string[]):void {
  if (!map.has(id)) errors.push(`${path} references missing id "${id}"`);
}

export function validateDocumentReferences(document:GraphicsDocument):DocumentValidationResult {
  const errors:string[]=[];
  const layers=ids(document.layers);
  const compositions=ids(document.compositions);
  const viewports=ids(document.viewports);
  const assets=ids(document.assets);
  const worlds=ids(document.worlds3d);
  const views=ids(document.views3d);

  duplicateIds(document.layers,"layers",errors);
  duplicateIds(document.compositions,"compositions",errors);
  duplicateIds(document.viewports,"viewports",errors);
  duplicateIds(document.assets,"assets",errors);
  duplicateIds(document.worlds3d,"worlds3d",errors);
  duplicateIds(document.views3d,"views3d",errors);

  for (const layer of document.layers) {
    if (layer.parentId) requireReference(layers,layer.parentId,`layer "${layer.id}" parentId`,errors);
    for (const childId of layer.children ?? []) requireReference(layers,childId,`layer "${layer.id}" children`,errors);
    if (layer.type==="3d-view") {
      if (!layer.view3dId) errors.push(`3d-view layer "${layer.id}" has no view3dId`);
      else requireReference(views,layer.view3dId,`layer "${layer.id}" view3dId`,errors);
    }
    const fontAssetId=layer.textStyle?.fontAssetId;
    if (fontAssetId) {
      requireReference(assets,fontAssetId,`layer "${layer.id}" fontAssetId`,errors);
      const asset=document.assets?.find(item=>item.id===fontAssetId);
      if (asset && asset.type!=="font") errors.push(`layer "${layer.id}" fontAssetId "${fontAssetId}" is not a font asset`);
    }
  }

  for (const composition of document.compositions ?? []) {
    for (const layerId of composition.layerIds) requireReference(layers,layerId,`composition "${composition.id}" layerIds`,errors);
  }

  for (const viewport of document.viewports ?? []) {
    for (const compositionId of viewport.compositionIds ?? []) requireReference(compositions,compositionId,`viewport "${viewport.id}" compositionIds`,errors);
  }

  const timeline=document.timeline;
  if (timeline) {
    for (const scene of timeline.scenes) requireReference(compositions,scene.compositionId,`scene "${scene.id}" compositionId`,errors);
    for (const track of timeline.tracks) requireReference(layers,track.layerId,`timeline track "${track.id}" layerId`,errors);
    for (const clip of timeline.clips ?? []) requireReference(layers,clip.layerId,`timeline clip "${clip.id}" layerId`,errors);
    if (timeline.currentSceneId) requireReference(new Map(timeline.scenes.map(scene=>[scene.id,scene])),timeline.currentSceneId,"timeline currentSceneId",errors);
  }

  for (const view of document.views3d ?? []) {
    requireReference(worlds,view.worldId,`3D view "${view.id}" worldId`,errors);
    const world=document.worlds3d?.find(item=>item.id===view.worldId);
    if (world) requireReference(new Map(world.cameras.map(camera=>[camera.id,camera])),view.cameraId,`3D view "${view.id}" cameraId`,errors);
  }

  for (const world of document.worlds3d ?? []) {
    duplicateIds(world.meshes,`world "${world.id}" meshes`,errors);
    duplicateIds(world.cameras,`world "${world.id}" cameras`,errors);
    duplicateIds(world.lights,`world "${world.id}" lights`,errors);
    const meshIds=ids(world.meshes);
    const cameraIds=ids(world.cameras);
    for (const track of world.timeline?.tracks ?? []) {
      const targetMap=track.targetType==="mesh"?meshIds:cameraIds;
      requireReference(targetMap,track.targetId,`world "${world.id}" ${track.targetType} track "${track.id}" targetId`,errors);
    }
    for (const mesh of world.meshes) {
      const textureAssetId=mesh.material?.textureAssetId;
      if (textureAssetId) {
        requireReference(assets,textureAssetId,`world "${world.id}" mesh "${mesh.id}" textureAssetId`,errors);
        const asset=document.assets?.find(item=>item.id===textureAssetId);
        if (asset && asset.type!=="image" && asset.type!=="video") errors.push(`world "${world.id}" mesh "${mesh.id}" textureAssetId "${textureAssetId}" is not an image or video asset`);
      }
    }
  }

  for (const output of document.outputs ?? []) {
    if (output.viewportId) requireReference(viewports,output.viewportId,`output "${output.id}" viewportId`,errors);
  }

  return {valid:errors.length===0,errors};
}

export function assertValidDocumentReferences(document:GraphicsDocument):void {
  const result=validateDocumentReferences(document);
  if (!result.valid) throw new Error(`Invalid document references:\n${result.errors.join("\n")}`);
}
