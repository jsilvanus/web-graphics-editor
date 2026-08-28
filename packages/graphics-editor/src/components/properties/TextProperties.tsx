import type { FC } from "react";
import { styleValue } from "../../geometry";
import type { GraphicsAsset, Layer, TextAlign, VerticalAlign } from "../../types";

export const TextProperties: FC<{ layer: Layer; assets: GraphicsAsset[]; onStyle: (key: string, value: string) => void; onText: (text: string) => void; onFont: (asset: GraphicsAsset) => void }> = ({ layer, assets, onStyle, onText, onFont }) => {
  const ts=layer.textStyle??{}; const fonts=assets.filter(a=>a.type==="font");
  const setTextStyle=(key:string,value:string)=>onStyle(`text-${key}`,value);
  const uploadFont=(file:File)=>{const reader=new FileReader();reader.onload=()=>{const id=`font-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;const family=file.name.replace(/\.(woff2?|ttf|otf)$/i,"").replace(/[-_]+/g," ").trim()||"Project Font";onFont({id,name:file.name,url:String(reader.result),type:"font",mimeType:file.type||undefined,size:file.size,metadata:{family}});setTextStyle("family",family)};reader.readAsDataURL(file)};
  const selectedFont=fonts.find(a=>a.id===ts.fontAssetId);
  return <div className="ge-section">
    <b>Text</b>
    <label>Content<textarea value={layer.text ?? ""} rows={5} onChange={e=>onText(e.target.value)} /></label>
    <label>Font family<select value={ts.fontAssetId??""} onChange={e=>{const a=fonts.find(x=>x.id===e.target.value);if(a){onFont(a);setTextStyle("family",String(a.metadata?.family??a.name))}else{setTextStyle("family",e.target.value)}}}><option value="">{ts.fontFamily??styleValue(layer,"font-family","Arial, sans-serif")}</option>{fonts.map(a=><option key={a.id} value={a.id}>{String(a.metadata?.family??a.name)}</option>)}</select></label>
    {selectedFont&&<small>Project font: {selectedFont.name}</small>}
    <label>Add font<input type="file" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" onChange={e=>{const f=e.target.files?.[0];if(f)uploadFont(f);e.currentTarget.value=""}} /></label>
    <div className="ge-two">
      <label>Size<input type="number" min="1" value={ts.fontSize??parseFloat(styleValue(layer,"font-size","72px"))} onChange={e=>setTextStyle("size",e.target.value)} /></label>
      <label>Weight<select value={String(ts.fontWeight??styleValue(layer,"font-weight","400"))} onChange={e=>setTextStyle("weight",e.target.value)}>{["300","400","500","600","700","800","900"].map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <div className="ge-two">
      <label>Align<select value={ts.textAlign??(styleValue(layer,"text-align","left") as TextAlign)} onChange={e=>setTextStyle("align",e.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
      <label>Vertical<select value={ts.verticalAlign??"top"} onChange={e=>setTextStyle("vertical-align",e.target.value as VerticalAlign)}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
    </div>
    <div className="ge-two"><label>Line height<input value={ts.lineHeight??"1.2"} onChange={e=>setTextStyle("line-height",e.target.value)} /></label><label>Letter spacing<input value={ts.letterSpacing??"0px"} onChange={e=>setTextStyle("letter-spacing",e.target.value)} /></label></div>
    <label>Wrap<select value={ts.wrap??"word"} onChange={e=>setTextStyle("wrap",e.target.value)}><option value="none">No wrap</option><option value="word">Word</option><option value="character">Character</option></select></label>
    <label>Color<input value={styleValue(layer,"color","#fff")} onChange={e=>onStyle("color",e.target.value)} /></label><label>Text shadow<input value={styleValue(layer,"text-shadow")} onChange={e=>onStyle("text-shadow",e.target.value)} /></label><label>Text stroke<input value={styleValue(layer,"-webkit-text-stroke")} onChange={e=>onStyle("-webkit-text-stroke",e.target.value)} /></label>
  </div>;
};