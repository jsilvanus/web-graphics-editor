import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { Layer, TextAlign, VerticalAlign } from "../../types";

export const TextProperties: FC<{ layer: Layer; onStyle: (key: string, value: string) => void; onText: (text: string) => void }> = ({ layer, onStyle, onText }) => {
  const ts=layer.textStyle??{};
  const setTextStyle=(key:string,value:string)=>onStyle(`text-${key}`,value);
  return <div className="ge-section">
    <b>Text</b>
    <label>Content<textarea value={layer.text ?? ""} rows={5} onChange={e=>onText(e.target.value)} /></label>
    <label>Font family<input value={ts.fontFamily??styleValue(layer,"font-family","Arial, sans-serif")} onChange={e=>setTextStyle("family",e.target.value)} /></label>
    <div className="ge-two">
      <label>Size<input type="number" min="1" value={ts.fontSize??parseFloat(styleValue(layer,"font-size","72px"))} onChange={e=>setTextStyle("size",e.target.value)} /></label>
      <label>Weight<select value={String(ts.fontWeight??styleValue(layer,"font-weight","400"))} onChange={e=>setTextStyle("weight",e.target.value)}>{["300","400","500","600","700","800","900"].map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <div className="ge-two">
      <label>Align<select value={ts.textAlign??(styleValue(layer,"text-align","left") as TextAlign)} onChange={e=>setTextStyle("align",e.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
      <label>Vertical<select value={ts.verticalAlign??"top"} onChange={e=>setTextStyle("vertical-align",e.target.value as VerticalAlign)}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
    </div>
    <div className="ge-two">
      <label>Line height<input value={ts.lineHeight??"1.2"} onChange={e=>setTextStyle("line-height",e.target.value)} /></label>
      <label>Letter spacing<input value={ts.letterSpacing??"0px"} onChange={e=>setTextStyle("letter-spacing",e.target.value)} /></label>
    </div>
    <label>Wrap<select value={ts.wrap??"word"} onChange={e=>setTextStyle("wrap",e.target.value)}><option value="none">No wrap</option><option value="word">Word</option><option value="character">Character</option></select></label>
    <label>Color<input value={styleValue(layer,"color","#fff")} onChange={e=>onStyle("color",e.target.value)} /></label>
    <label>Text shadow<input value={styleValue(layer,"text-shadow")} onChange={e=>onStyle("text-shadow",e.target.value)} /></label>
    <label>Text stroke<input value={styleValue(layer,"-webkit-text-stroke")} onChange={e=>onStyle("-webkit-text-stroke",e.target.value)} /></label>
  </div>;
};
