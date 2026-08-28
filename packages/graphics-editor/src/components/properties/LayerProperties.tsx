import type { FC } from "react";
import type { GraphicsAsset, Layer } from "../../types";
import { AnimationProperties } from "./AnimationProperties";
import { ImageProperties } from "./ImageProperties";
import { PathProperties } from "./PathProperties";
import { ShapeProperties } from "./ShapeProperties";
import { TextProperties } from "./TextProperties";
import { TransformProperties } from "./TransformProperties";

export const LayerProperties: FC<{layer:Layer;assets:GraphicsAsset[];aspectLock:boolean;onLayer:(id:string,patch:Partial<Layer>)=>void;onStyle:(id:string,key:string,value:string|number)=>void;onChooseAsset:(asset:GraphicsAsset)=>void;onToggleAssetPicker:()=>void;onAspectLock:(value:boolean)=>void;assetPicker:boolean;onFont:(asset:GraphicsAsset)=>void}> = ({layer,assets,aspectLock,onLayer,onStyle,onChooseAsset,onToggleAssetPicker,onAspectLock,assetPicker,onFont}) => {
 const patch=(value:Partial<Layer>)=>onLayer(layer.id,value); const style=(key:string,value:string)=>onStyle(layer.id,key,value);
 return <><div className="ge-section"><b>Layer: {layer.id}</b><label>Type<span>{layer.type}</span></label></div><TransformProperties layer={layer} aspectLock={aspectLock} onLayer={patch} onAspectLock={onAspectLock}/><div className="ge-section"><label>Opacity<input type="range" min="0" max="1" step="0.01" value={Number(layer.style?.opacity??1)} onChange={e=>style("opacity",e.target.value)}/></label></div>{layer.type==="text"&&<TextProperties layer={layer} assets={assets} onStyle={style} onText={text=>patch({text})} onFont={onFont}/>} {(layer.type==="rectangle"||layer.type==="ellipse")&&<ShapeProperties layer={layer} onStyle={style}/>} {(layer.type==="line"||layer.type==="path")&&<PathProperties layer={layer} onStyle={style}/>} {layer.type==="image"&&<ImageProperties layer={layer} assets={assets} onLayer={patch} onTogglePicker={onToggleAssetPicker} onChooseAsset={onChooseAsset} pickerOpen={assetPicker}/>}<AnimationProperties layer={layer} onAnimation={animation=>patch({animation})}/></>;
};