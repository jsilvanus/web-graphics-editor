import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { ResizeHandles } from "./ResizeHandles";
import { RotateHandle } from "./RotateHandle";
import { layerStyle } from "../../geometry";
import { VectorLayer } from "./VectorLayer";
import type { Layer } from "../../types";

export const CanvasLayer: FC<{layer:Layer;selected:boolean;multiSelected:boolean;onPointerDown:(event:ReactPointerEvent,kind:"move"|"resize"|"rotate",handle?:string)=>void}> = ({layer,selected,multiSelected,onPointerDown}) => {
 if(layer.type==="line"||layer.type==="path")return <VectorLayer layer={layer} selected={selected} multiSelected={multiSelected} onPointerDown={onPointerDown}/>;
 const t=layer.textStyle??{}; const align=t.textAlign??String(layer.style?.["text-align"]??"left");
 return <div style={layerStyle(layer,selected)} onPointerDown={event=>onPointerDown(event,"move")}>
  {layer.type==="text"&&<div style={{width:"100%",height:"100%",pointerEvents:"none",overflow:t.wrap==="none"?"visible":"hidden",display:"flex",flexDirection:"column",justifyContent:t.verticalAlign==="middle"?"center":t.verticalAlign==="bottom"?"flex-end":"flex-start",textAlign:align as "left"|"center"|"right",fontFamily:t.fontFamily??String(layer.style?.["font-family"]??"Arial, sans-serif"),fontSize:t.fontSize??parseFloat(String(layer.style?.["font-size"]??"72")),fontWeight:t.fontWeight??String(layer.style?.["font-weight"]??400),fontStyle:t.fontStyle??"normal",lineHeight:t.lineHeight??1.2,letterSpacing:t.letterSpacing??"0px",whiteSpace:t.whiteSpace??"pre-wrap",overflowWrap:t.wrap==="character"?"anywhere":"break-word",color:String(layer.style?.color??"#fff")}}>{layer.text}</div>}
  {layer.type==="ellipse"&&<div style={{width:"100%",height:"100%",borderRadius:"50%",pointerEvents:"none"}}/>}
  {layer.type==="rectangle"&&<div style={{width:"100%",height:"100%",pointerEvents:"none"}}/>}
  {layer.type==="image"&&<img src={layer.src||""} alt="" draggable={false} style={{width:"100%",height:"100%",objectFit:String(layer.style?.["object-fit"]??"contain"),pointerEvents:"none"}}/>}
  {selected&&!multiSelected&&<><ResizeHandles layer={layer} onPointerDown={(event,handle)=>onPointerDown(event,"resize",handle)}/><RotateHandle layer={layer} onPointerDown={event=>onPointerDown(event,"rotate")}/></>}
 </div>;
};
