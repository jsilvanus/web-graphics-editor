import { useEffect, useMemo } from "react";
import type { GraphicsAsset, GraphicsDocument } from "../types";

export function useProjectAssets(document:GraphicsDocument,assets:GraphicsAsset[]){
 const projectAssets=useMemo(()=>[...assets,...(document.assets??[])].filter((a,i,all)=>all.findIndex(x=>x.id===a.id)===i),[assets,document.assets]);
 useEffect(()=>{for(const asset of projectAssets.filter(a=>a.type==="font"&&a.url)){const family=String(asset.metadata?.family??asset.name);const font=new FontFace(family,`url(${asset.url})`);font.load().then(f=>document.fonts.add(f)).catch(()=>{});}},[projectAssets]);
 return projectAssets;
}
