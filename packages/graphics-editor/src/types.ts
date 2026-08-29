export interface Point{x:number;y:number}
export type PathNodeKind="corner"|"smooth"; export interface PathNode{x:number;y:number;kind?:PathNodeKind;handleIn?:Point;handleOut?:Point}
export type LayerType="text"|"image"|"rectangle"|"ellipse"|"line"|"path"|"group"|"3d-view";
export type PathCommand={type:"M"|"L";x:number;y:number}|{type:"H";x:number}|{type:"V";y:number}|{type:"C";x1:number;y1:number;x2:number;y2:number;x:number;y:number}|{type:"Q";x1:number;y1:number;x:number;y:number}|{type:"Z"};
export type TextAlign="left"|"center"|"right"; export type VerticalAlign="top"|"middle"|"bottom";
export interface GradientStop{offset:number;color:string;opacity?:number}
export interface Gradient{type:"linear"|"radial";angle?:number;cx?:number;cy?:number;stops:GradientStop[]}
export interface Layer{id:string;type:LayerType;x:number;y:number;width:number;height:number;rotation?:number;opacity?:number;text?:string;src?:string;path?:string;pathCommands?:PathCommand[];nodes?:PathNode[];closed?:boolean;children?:string[];parentId?:string;animation?:string;style?:Record<string,string|number>;gradient?:Gradient;textStyle?:{fontFamily?:string;fontSize?:number;fontWeight?:number|string;fontStyle?:"normal"|"italic";textAlign?:TextAlign;verticalAlign?:VerticalAlign;lineHeight?:number|string;letterSpacing?:number|string;whiteSpace?:"nowrap"|"pre-wrap";wrap?:"none"|"word"|"character";fontAssetId?:string};view3dId?:string}
export type AnimationTuple=number[];
export type AnimationValue=number|string|boolean|AnimationTuple;
export type Easing="linear"|"ease-in"|"ease-out"|"ease-in-out"|"step-start"|"step-end"|"cubic-bezier";
export type InterpolationMode="linear"|"discrete"|"cubic-bezier";
export type ColorInterpolationSpace="srgb"|"linear-srgb"|"oklab"|"oklch";
export interface EasingParameters{mode:Easing;bezier?:[number,number,number,number]}
export interface InterpolationOptions{mode?:InterpolationMode;easing?:EasingParameters;colorSpace?:ColorInterpolationSpace}
export interface AnimationKeyframe<T extends AnimationValue=AnimationValue>{id:string;time:number;value:T;interpolation?:InterpolationOptions}
export interface KeyframeGroup{id:string;time:number;keyframeIds:string[]}
export interface AnimationTrack<T extends AnimationValue=AnimationValue>{id:string;targetId:string;property:string;keyframes:AnimationKeyframe<T>[];groupIds?:string[]}
export type AnimatedProperty="x"|"y"|"width"|"height"|"rotation"|"opacity"|"scaleX"|"scaleY";
/** Legacy numeric timeline representation retained for document compatibility. */
export interface Keyframe{id:string;time:number;value:number;easing?:Easing}
export interface Track{id:string;layerId:string;property:AnimatedProperty;keyframes:Keyframe[]}
export type Graphics3DAnimatedProperty="positionX"|"positionY"|"positionZ"|"rotationX"|"rotationY"|"rotationZ"|"scaleX"|"scaleY"|"scaleZ"|"fov"|"opacity"|"visibility"|"materialColor"|"materialOpacity";
export type Graphics3DAnimationTarget="mesh"|"camera";
export interface Graphics3DTrack{id:string;targetType:Graphics3DAnimationTarget;targetId:string;property:Graphics3DAnimatedProperty;keyframes:AnimationKeyframe[]}
export interface Graphics3DWorldTimeline{duration?:number;tracks:Graphics3DTrack[];loop?:boolean}
export type LayerClip={id:string;layerId:string;start:number;duration:number}
export type SceneTransitionType="cut"|"fade"|"dissolve"|"slide-left"|"slide-right"|"slide-up"|"slide-down";
export interface SceneTransition{type:SceneTransitionType;duration:number}
export interface Scene{id:string;name:string;start:number;duration:number;transition?:SceneTransition}
export interface SceneTimeline{scenes:Scene[];currentSceneId:string;currentTime:number;tracks:Track[];clips?:LayerClip[];loop?:boolean}
export interface WorldTimeMapping{offset:number;rate:number;loop?:boolean;inPoint?:number;outPoint?:number}
export type ProvenanceSource="user"|"generated"|"imported"|"derived"|"ai";
export interface Provenance{source:ProvenanceSource;createdBy?:string;sourceId?:string;sourceUri?:string;parentIds?:string[];createdAt?:string}
export interface Graphics3DTransform{position:[number,number,number];rotation:[number,number,number];scale:[number,number,number]}
export interface Graphics3DMaterial{color?:string;opacity?:number;metalness?:number;roughness?:number;wireframe?:boolean;textureAssetId?:string}
export interface Graphics3DMeshGeometry{vertices:number[];indices:number[];normals?:number[];uv?:number[]}
export interface Graphics3DMesh{ id:string;name?:string;geometry:Graphics3DMeshGeometry;transform:Graphics3DTransform;material?:Graphics3DMaterial;provenance?:Provenance }
export interface Graphics3DLight{ id:string;type:"ambient"|"directional"|"point"|"spot";position?:[number,number,number];rotation?:[number,number,number];color?:string;intensity?:number;distance?:number;angle?:number;penumbra?:number }
export interface Graphics3DCamera{ id:string;name?:string;position:[number,number,number];rotation:[number,number,number];projection:"perspective"|"orthographic";fov?:number;near?:number;far?:number;zoom?:number }
export interface Graphics3DWorld{id:string;name?:string;meshes:Graphics3DMesh[];lights?:Graphics3DLight[];cameras:Graphics3DCamera[];timeline?:Graphics3DWorldTimeline;provenance?:Provenance}
export interface Graphics3DVisibility{mode:"all"|"include"|"exclude";objects:string[]}
export type Graphics3DRenderMode="auto"|"prerender"|"live";
export type Graphics3DResolutionMode="auto"|"custom";
export interface Graphics3DRenderSettings{resolutionMode?:Graphics3DResolutionMode;resolutionWidth?:number;resolutionHeight?:number;resolutionScale?:number;maxPixelRatio?:number;background?:string;backgroundOpacity?:number;shadows?:boolean;environmentColor?:string;environmentIntensity?:number}
export interface Graphics3DView{ id:string;name?:string;worldId:string;cameraId:string;visibility?:Graphics3DVisibility;renderMode?:Graphics3DRenderMode;renderSettings?:Graphics3DRenderSettings;renderAssetId:string;x:number;y:number;width:number;height:number;rotation?:number;opacity?:number;provenance?:Provenance;worldTime?:WorldTimeMapping}
export interface GraphicsDocument{width:number;height:number;background?:string;layers:Layer[];timeline?:SceneTimeline;assets?:GraphicsAsset[];worlds3d?:Graphics3DWorld[];views3d?:Graphics3DView[]}
export interface GraphicsAsset{id:string;name:string;url:string;type:"image"|"video"|"font"|"other";mimeType?:string;size?:number;metadata?:Record<string,string|number>}
export interface GraphicsEditorProps{document:GraphicsDocument;assets?:GraphicsAsset[];onChange:(document:GraphicsDocument)=>void}