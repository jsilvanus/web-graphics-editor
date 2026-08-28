export interface Point{x:number;y:number}
export type PathNodeKind="corner"|"smooth"; export interface PathNode{x:number;y:number;kind?:PathNodeKind;handleIn?:Point;handleOut?:Point}
export type LayerType="text"|"image"|"rectangle"|"ellipse"|"line"|"path"|"group";
export type PathCommand={type:"M"|"L";x:number;y:number}|{type:"H";x:number}|{type:"V";y:number}|{type:"C";x1:number;y1:number;x2:number;y2:number;x:number;y:number}|{type:"Q";x1:number;y1:number;x:number;y:number}|{type:"Z"};
export type TextAlign="left"|"center"|"right"; export type VerticalAlign="top"|"middle"|"bottom";
export interface GradientStop{offset:number;color:string;opacity?:number}
export interface Gradient{type:"linear"|"radial";angle?:number;cx?:number;cy?:number;stops:GradientStop[]}
export interface Layer{id:string;type:LayerType;x:number;y:number;width:number;height:number;rotation?:number;text?:string;src?:string;path?:string;pathCommands?:PathCommand[];nodes?:PathNode[];closed?:boolean;children?:string[];parentId?:string;animation?:string;style?:Record<string,string|number>;gradient?:Gradient;textStyle?:{fontFamily?:string;fontSize?:number;fontWeight?:number|string;fontStyle?:"normal"|"italic";textAlign?:TextAlign;verticalAlign?:VerticalAlign;lineHeight?:number|string;letterSpacing?:number|string;whiteSpace?:"nowrap"|"pre-wrap";wrap?:"none"|"word"|"character";fontAssetId?:string}};
export type AnimatedProperty="x"|"y"|"width"|"height"|"rotation"|"opacity"|"scaleX"|"scaleY";
export type Easing="linear"|"ease-in"|"ease-out"|"ease-in-out";
export interface Keyframe{id:string;time:number;value:number;easing?:Easing}
export interface Track{id:string;layerId:string;property:AnimatedProperty;keyframes:Keyframe[]}
export interface LayerClip{id:string;layerId:string;start:number;duration:number}
export type SceneTransitionType="cut"|"fade"|"dissolve"|"slide-left"|"slide-right"|"slide-up"|"slide-down";
export interface SceneTransition{type:SceneTransitionType;duration:number}
export interface Scene{id:string;name:string;start:number;duration:number;transition?:SceneTransition}
export interface SceneTimeline{scenes:Scene[];currentSceneId:string;currentTime:number;tracks:Track[];clips?:LayerClip[];loop?:boolean}
export interface GraphicsDocument{width:number;height:number;background?:string;layers:Layer[];timeline?:SceneTimeline;assets?:GraphicsAsset[]}
export interface GraphicsAsset{id:string;name:string;url:string;type:"image"|"video"|"font"|"other";mimeType?:string;size?:number;metadata?:Record<string,string|number>}
export interface GraphicsEditorProps{document:GraphicsDocument;assets?:GraphicsAsset[];onChange:(document:GraphicsDocument)=>void}