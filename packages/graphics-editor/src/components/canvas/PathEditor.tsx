import type { FC, PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useState } from "react";
import type { Layer, PathNode, Point } from "../../types";
import { mirrorHandle } from "../../geometry";

type Drag = { index:number; part:"node"|"in"|"out"; start:Point; nodes:PathNode[]; selected:number[]; broken?:boolean };

function cloneNodes(nodes:PathNode[]) {
  return nodes.map(n => ({ ...n, handleIn:n.handleIn&&{...n.handleIn}, handleOut:n.handleOut&&{...n.handleOut} }));
}

function cubic(a:Point,c1:Point,c2:Point,b:Point,t:number):Point {
  const mt=1-t;
  return { x:mt*mt*mt*a.x+3*mt*mt*t*c1.x+3*mt*t*t*c2.x+t*t*t*b.x,
    y:mt*mt*mt*a.y+3*mt*mt*t*c1.y+3*mt*t*t*c2.y+t*t*t*b.y };
}

function splitCubic(a:Point,c1:Point,c2:Point,b:Point,t:number) {
  const ab={x:a.x+(c1.x-a.x)*t,y:a.y+(c1.y-a.y)*t};
  const bc={x:c1.x+(c2.x-c1.x)*t,y:c1.y+(c2.y-c1.y)*t};
  const cd={x:c2.x+(b.x-c2.x)*t,y:c2.y+(b.y-c2.y)*t};
  const abc={x:ab.x+(bc.x-ab.x)*t,y:ab.y+(bc.y-ab.y)*t};
  const bcd={x:bc.x+(cd.x-bc.x)*t,y:bc.y+(cd.y-bc.y)*t};
  const p={x:abc.x+(bcd.x-abc.x)*t,y:abc.y+(bcd.y-abc.y)*t};
  return { leftOut:ab, leftEnd:abc, rightIn:bcd, rightStart:p };
}

export const PathEditor: FC<{ layer:Layer; onNodes:(nodes:PathNode[])=>void }> = ({layer,onNodes}) => {
  const nodes=layer.nodes??[];
  const [selected,setSelected]=useState<number[]>([]);
  const [drag,setDrag]=useState<Drag|null>(null);

  const point=(event:ReactPointerEvent,svg:SVGSVGElement):Point => {
    const r=svg.getBoundingClientRect();
    return {x:(event.clientX-r.left)*layer.width/r.width,y:(event.clientY-r.top)*layer.height/r.height};
  };

  const begin=(event:ReactPointerEvent,index:number,part:"node"|"in"|"out") => {
    const svg=event.currentTarget.ownerSVGElement;
    if(!svg)return;
    event.stopPropagation();
    const nextSelection=event.shiftKey
      ? (selected.includes(index)?selected.filter(i=>i!==index):[...selected,index])
      : [index];
    const broken=event.altKey||event.metaKey;
    const current=cloneNodes(nodes);
    if(broken&&part!=="node") {
      current[index].kind="corner";
      onNodes(current);
    }
    setSelected(nextSelection);
    setDrag({index,part,start:point(event,svg),nodes:current,selected:nextSelection,broken});
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  };

  const move=(event:ReactPointerEvent) => {
    if(!drag)return;
    const svg=event.currentTarget as SVGSVGElement;
    const p=point(event,svg);
    const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
    let next:PathNode[];
    if(drag.part==="node") {
      next=drag.nodes.map((node,i)=>drag.selected.includes(i)
        ? {...node,x:node.x+dx,y:node.y+dy,
            handleIn:node.handleIn&&{x:node.handleIn.x+dx,y:node.handleIn.y+dy},
            handleOut:node.handleOut&&{x:node.handleOut.x+dx,y:node.handleOut.y+dy}}
        : node);
    } else {
      next=drag.nodes.map((node,i)=>{
        if(i!==drag.index)return node;
        if(drag.broken)return {...node,[drag.part==="in"?"handleIn":"handleOut"]:p};
        return mirrorHandle(node,drag.part,p);
      });
    }
    onNodes(next);
    setDrag({...drag,start:p,nodes:next});
  };

  const toggleKind=(index:number) => {
    const next=cloneNodes(nodes);
    next[index].kind=next[index].kind==="smooth"?"corner":"smooth";
    if(next[index].kind==="smooth"&&!next[index].handleIn&&!next[index].handleOut){
      next[index].handleIn={x:next[index].x-40,y:next[index].y};
      next[index].handleOut={x:next[index].x+40,y:next[index].y};
    }
    onNodes(next); setSelected([index]);
  };

  const addHandle=(index:number,part:"in"|"out") => {
    const next=cloneNodes(nodes),n=next[index];
    const dx=part==="in"?-50:50;
    const h={x:n.x+dx,y:n.y};
    if(part==="in")n.handleIn=h; else n.handleOut=h;
    n.kind="smooth"; onNodes(next); setSelected([index]);
  };

  const deleteNode=(index:number) => {
    if(nodes.length<=2)return;
    const next=cloneNodes(nodes);
    next.splice(index,1);
    onNodes(next);
    setSelected(previous=>previous.filter(i=>i!==index).map(i=>i>index?i-1:i));
  };

  const insertNode=(event:ReactPointerEvent,index:number) => {
    const svg=event.currentTarget.ownerSVGElement;
    if(!svg)return;
    event.stopPropagation();
    const p=point(event,svg);
    const next=cloneNodes(nodes);
    const j=(index+1)%nodes.length;
    if(j===0&&!layer.closed)return;
    const a=nodes[index],b=nodes[j];
    const c1=a.handleOut??{x:a.x,y:a.y},c2=b.handleIn??{x:b.x,y:b.y};
    const curved=!!(a.handleOut||b.handleIn);
    if(curved) {
      const ab={x:a.x+(c1.x-a.x)*0.5,y:a.y+(c1.y-a.y)*0.5};
      const bc={x:c1.x+(c2.x-c1.x)*0.5,y:c1.y+(c2.y-c1.y)*0.5};
      const cd={x:c2.x+(b.x-c2.x)*0.5,y:c2.y+(b.y-c2.y)*0.5};
      const abc={x:ab.x+(bc.x-ab.x)*0.5,y:ab.y+(bc.y-ab.y)*0.5};
      const bcd={x:bc.x+(cd.x-bc.x)*0.5,y:bc.y+(cd.y-bc.y)*0.5};
      const mid={x:abc.x+(bcd.x-abc.x)*0.5,y:abc.y+(bcd.y-abc.y)*0.5};
      const d=splitCubic({x:a.x,y:a.y},c1,c2,{x:b.x,y:b.y},0.5);
      next[index]={...next[index],handleOut:d.leftOut};
      const inserted:PathNode={x:mid.x,y:mid.y,kind:"smooth",handleIn:d.leftEnd,handleOut:d.rightIn};
      next.splice(index+1,0,inserted);
      next[index+2]={...next[index+2],handleIn:d.rightIn};
    } else {
      const t=Math.max(0,Math.min(1,Math.abs(b.x-a.x)>=Math.abs(b.y-a.y)?(p.x-a.x)/(b.x-a.x||1):(p.y-a.y)/(b.y-a.y||1)));
      next.splice(index+1,0,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,kind:"corner"});
    }
    onNodes(next); setSelected([index+1]);
  };

  const keyDown=(event:ReactKeyboardEvent<SVGSVGElement>) => {
    if(!selected.length)return;
    if(event.key==="Delete"||event.key==="Backspace"){
      event.preventDefault();
      selected.slice().sort((a,b)=>b-a).forEach(deleteNode);
    } else if(event.key==="Enter"){
      event.preventDefault(); toggleKind(selected[0]);
    }
  };

  return <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width,1)} ${Math.max(layer.height,1)}`} style={{position:"absolute",inset:0,overflow:"visible",zIndex:500,pointerEvents:"none"}} tabIndex={0} aria-label="Path node editor" onKeyDown={keyDown} onPointerMove={move} onPointerUp={()=>setDrag(null)}>
    {nodes.map((node,i)=>{
      const nextIndex=i+1<nodes.length?i+1:(layer.closed?0:-1);
      return <g key={i}>
        {nextIndex>=0&&<line x1={node.x} y1={node.y} x2={nodes[nextIndex].x} y2={nodes[nextIndex].y} stroke="transparent" strokeWidth="18" style={{pointerEvents:"all",cursor:"copy"}} onDoubleClick={e=>insertNode(e,i)}/>}
        {node.handleIn&&<><line x1={node.x} y1={node.y} x2={node.handleIn.x} y2={node.handleIn.y} stroke="#38bdf8" strokeDasharray="4 3"/><circle cx={node.handleIn.x} cy={node.handleIn.y} r="6" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{pointerEvents:"all",cursor:"crosshair"}} onPointerDown={e=>begin(e,i,"in")}/></>}
        {node.handleOut&&<><line x1={node.x} y1={node.y} x2={node.handleOut.x} y2={node.handleOut.y} stroke="#38bdf8" strokeDasharray="4 3"/><circle cx={node.handleOut.x} cy={node.handleOut.y} r="6" fill="#fff" stroke="#38bdf8" strokeWidth="2" style={{pointerEvents:"all",cursor:"crosshair"}} onPointerDown={e=>begin(e,i,"out")}/></>}
        <circle cx={node.x} cy={node.y} r={selected.includes(i)?9:7} fill={node.kind==="smooth"?"#38bdf8":"#fff"} stroke="#38bdf8" strokeWidth={selected.includes(i)?4:3} style={{pointerEvents:"all",cursor:"move"}} onPointerDown={e=>begin(e,i,"node")} onDoubleClick={()=>toggleKind(i)} onContextMenu={e=>{e.preventDefault();deleteNode(i)}}/>
        {node.kind==="smooth"&&!node.handleIn&&<circle cx={node.x-11} cy={node.y} r="4" fill="#38bdf8" style={{pointerEvents:"all",cursor:"crosshair"}} onPointerDown={e=>{e.stopPropagation();addHandle(i,"in")}}/>}
        {node.kind==="smooth"&&!node.handleOut&&<circle cx={node.x+11} cy={node.y} r="4" fill="#38bdf8" style={{pointerEvents:"all",cursor:"crosshair"}} onPointerDown={e=>{e.stopPropagation();addHandle(i,"out")}}/>}
      </g>;
    })}
  </svg>;
};
