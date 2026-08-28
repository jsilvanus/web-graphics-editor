import type { FC } from "react";
import { styleValue } from "../../geometry";
import { defaultGradient } from "../../gradient";
import type { Gradient, GradientStop, Layer } from "../../types";

export const ShapeProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void; onGradient?: (gradient: Gradient | undefined) => void }> = ({ layer, onStyle, onGradient }) => {
  const g=layer.gradient;
  const setG=(patch:Partial<Gradient>)=>onGradient?.({...defaultGradient(),...g,...patch,stops:g?.stops??defaultGradient().stops});
  const setStop=(i:number,patch:Partial<GradientStop>)=>onGradient?.({...g!,stops:g!.stops.map((s,n)=>n===i?{...s,...patch}:s)});
  return <div className="ge-section">
    <b>{layer.type === "ellipse" ? "Ellipse" : "Rectangle"}</b>
    <label>Fill<input value={styleValue(layer,"background",layer.type==="ellipse"?"#fff":"#111")} onChange={e=>onStyle("background",e.target.value)}/></label>
    <label>Gradient type<select value={g?.type??"none"} onChange={e=>e.target.value==="none"?onGradient?.(undefined):setG({type:e.target.value as Gradient["type"]})}><option value="none">None</option><option value="linear">Linear</option><option value="radial">Circular / radial</option></select></label>
    {g&&<>
      {g.type==="linear"?<label>Angle<input type="number" value={g.angle??90} min="0" max="360" onChange={e=>setG({angle:Number(e.target.value)})}/></label>:<div className="ge-two"><label>Center X<input type="number" value={g.cx??50} min="0" max="100" onChange={e=>setG({cx:Number(e.target.value)})}/></label><label>Center Y<input type="number" value={g.cy??50} min="0" max="100" onChange={e=>setG({cy:Number(e.target.value)})}/></label></div>}
      <div><b>Stops</b>{g.stops.map((s,i)=><div className="ge-two" key={i}><input type="color" value={s.color} onChange={e=>setStop(i,{color:e.target.value})}/><input type="number" min="0" max="100" value={Math.round(s.offset*100)} onChange={e=>setStop(i,{offset:Number(e.target.value)/100})}/>{g.stops.length>2&&<button type="button" onClick={()=>onGradient?.({...g,stops:g.stops.filter((_,n)=>n!==i)})}>×</button>}</div>)}<button type="button" onClick={()=>onGradient?.({...g,stops:[...g.stops,{offset:.5,color:"#808080",opacity:1}]})}>+ Stop</button></div>
    </>}
    <label>Stroke<input value={styleValue(layer,"border")} onChange={e=>onStyle("border",e.target.value)}/></label>
    <label>Border radius<input value={styleValue(layer,"border-radius")} onChange={e=>onStyle("border-radius",e.target.value)}/></label>
    <label>Shadow<select value={styleValue(layer,"boxShadow","none")} onChange={e=>onStyle("boxShadow",e.target.value)}><option value="none">None</option><option value="4px 4px 12px rgba(0,0,0,.35)">Soft</option><option value="0 0 20px rgba(0,0,0,.5)">Glow</option></select></label>
    <label>Custom shadow<input value={styleValue(layer,"boxShadow")} placeholder="0 4px 12px rgba(0,0,0,.3)" onChange={e=>onStyle("boxShadow",e.target.value)}/></label>
  </div>;
};