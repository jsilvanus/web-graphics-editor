import * as THREE from "three";
import type { Graphics3DCamera, Graphics3DView, Graphics3DWorld } from "./types";
import { createThreeCamera } from "./3d-renderer-camera";
import { createThreeGeometry } from "./3d-renderer-geometry";
import { createThreeScene } from "./3d-renderer-scene";

export interface Graphics3DRenderOptions { background?: string|number; backgroundOpacity?: number; pixelRatio?: number; width?: number; height?: number; shadows?: boolean; environmentColor?: string; environmentIntensity?: number }
export interface Graphics3DRenderer { render(world:Graphics3DWorld,camera:Graphics3DCamera,view?:Pick<Graphics3DView,"visibility">,options?:Graphics3DRenderOptions):THREE.Scene;mount(container:HTMLElement,preserveDrawingBuffer?:boolean):void;resize(width?:number,height?:number):void;getCanvas():HTMLCanvasElement|undefined;dispose():void }
export { createThreeCamera,createThreeGeometry,createThreeScene };

export class ThreeGraphics3DRenderer implements Graphics3DRenderer {
 private renderer?:THREE.WebGLRenderer; private container?:HTMLElement;
 mount(container:HTMLElement,preserveDrawingBuffer=false):void{this.container=container;this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.renderer.setClearColor(0,0);this.resize();container.appendChild(this.renderer.domElement);}
 render(world:Graphics3DWorld,camera:Graphics3DCamera,view?:Pick<Graphics3DView,"visibility">,options:Graphics3DRenderOptions={}):THREE.Scene{const scene=createThreeScene(world,view,{shadows:options.shadows,environmentColor:options.environmentColor,environmentIntensity:options.environmentIntensity});const backgroundOpacity=Math.max(0,Math.min(1,options.backgroundOpacity??1));if(options.background!==undefined)scene.background=new THREE.Color(options.background);if(!this.renderer)return scene;const width=Math.max(1,options.width??this.container?.clientWidth??1),height=Math.max(1,options.height??this.container?.clientHeight??1),pixelRatio=Math.max(.25,options.pixelRatio??Math.min(window.devicePixelRatio||1,2));this.renderer.setPixelRatio(pixelRatio);this.renderer.setSize(width,height,false);this.renderer.shadowMap.enabled=!!options.shadows;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.setClearColor(options.background===undefined?0:options.background,options.background===undefined?0:backgroundOpacity);this.renderer.render(scene,createThreeCamera(camera,width/height));return scene;}
 resize(width=this.container?.clientWidth||1,height=this.container?.clientHeight||1):void{this.renderer?.setSize(Math.max(1,width),Math.max(1,height),false);}
 getCanvas():HTMLCanvasElement|undefined{return this.renderer?.domElement;}
 dispose():void{this.renderer?.dispose();this.renderer?.domElement.remove();this.renderer=undefined;this.container=undefined;}
}
