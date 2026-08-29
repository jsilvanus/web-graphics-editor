import type { FC } from "react";
import type { Easing, AnimationKeyframe } from "../../types";

export interface TimelineKeyframeEditorValue extends AnimationKeyframe<number> {}
export interface TimelineKeyframeEditorProps { value?: TimelineKeyframeEditorValue; onTimeChange:(time:number)=>void; onValueChange:(value:number)=>void; onEasingChange:(easing:Easing)=>void; onDelete:()=>void; }

export const TimelineKeyframeEditor:FC<TimelineKeyframeEditorProps>=({value,onTimeChange,onValueChange,onEasingChange,onDelete})=>{
 if(!value)return null;
 const easing=value.interpolation?.easing?.mode??"linear";
 const allowed:[Easing,string][]=[["linear","Linear"],["ease-in","Ease in"],["ease-out","Ease out"],["ease-in-out","Ease in/out"],["step-start","Step start"],["step-end","Step end"],["cubic-bezier","Cubic Bézier"]];
 return <div className="ge-key-editor"><b>Keyframe</b><label>Time<input type="number" min="0" step="0.01" value={value.time} onChange={e=>onTimeChange(Number(e.target.value)||0)}/></label><label>Value<input type="number" step="0.01" value={value.value} onChange={e=>onValueChange(Number(e.target.value)||0)}/></label><label>Easing<select value={easing} onChange={e=>onEasingChange(e.target.value as Easing)}>{allowed.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label><button onClick={onDelete}>Delete keyframe</button></div>;
};
