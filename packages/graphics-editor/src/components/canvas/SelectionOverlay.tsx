import type { FC, PointerEvent as ReactPointerEvent } from "react";
import type { Layer } from "../../types";
const handles=["nw","n","ne","e","se","s","sw","w"];
const cursor:Record<string,string>={nw:"nwse-resize",se:"nwse-resize",ne:"nesw-resize",sw:"nesw-resize",n:"ns-resize",s:"ns-resize",e:"ew-resize",w:"ew-resize"};
export const SelectionOverlay:FC<{layers:Layer[];selectedIds:Set<string>;onPointerDown?:(event:ReactPointerEvent,kind:"resize"|"rotate",handle?:string)=>void}>=({layers,selectedIds,onPointerDown})=>{
 const selected=layers.filter(l=>selectedIds.has(l.id));
 if(!selected.length)return null;
 const boxes=selected.map(l=>({x:l.x,y:l.y,r:l.x+l.width,b:l.y+l.height}));const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),r=Math.max(...boxes.map(b=>b.r)),b=Math.max(...boxes.map(b=>b.b)),w=r-x,h=b-y;
 if(selected.length===1)return <div aria-hidden="true" style={{position:"absolute",left:x,top:y,width:w,height:h,border:"1px dashed rgba(56,189,248,.45)",pointerEvents:"none",boxSizing:"border-box"}}/>;
 const pos=(handle:string)=>({left:handle.includes("e")?w:handle.includes("w")?0:w/2,top:handle.includes("s")?h:handle.includes("n")?0:h/2});
 return <div aria-label="Multi-selection transform box" style={{position:"absolute",left:x,top:y,width:w,height:h,border:"2px solid #38bdf8",boxSizing:"border-box",pointerEvents:"none",zIndex:300}}>{handles.map(handle=>{const p=pos(handle);return <span key={handle} style={{position:"absolute",left:p.left,top:p.top,width:10,height:10,transform:"translate(-50%,-50%)",border:"2px solid #38bdf8",background:"#fff",boxSizing:"border-box",cursor:cursor[handle],pointerEvents:"auto"}} onPointerDown={e=>onPointerDown?.(e,"resize",handle)}/>})}<span style={{position:"absolute",left:w/2,top:-32,width:12,height:12,transform:"translateX(-50%)",border:"2px solid #38bdf8",borderRadius:"50%",background:"#fff",cursor:"grab",pointerEvents:"auto"}} onPointerDown={e=>onPointerDown?.(e,"rotate")}/></div>;
};
