import * as THREE from "three";
import type { Graphics3DCamera, Graphics3DView, Graphics3DWorld } from "./types";
import { createThreeCamera } from "./3d-renderer-camera";
import { createThreeGeometry } from "./3d-renderer-geometry";
import { createThreeScene } from "./3d-renderer-scene";

export interface Graphics3DRenderOptions {
  background?: string | number;
  pixelRatio?: number;
  width?: number;
  height?: number;
}

export interface Graphics3DRenderer {
  render(world: Graphics3DWorld, camera: Graphics3DCamera, view?: Pick<Graphics3DView, "visibility">, options?: Graphics3DRenderOptions): THREE.Scene;
  mount(container: HTMLElement, preserveDrawingBuffer?: boolean): void;
  resize(width?: number, height?: number): void;
  getCanvas(): HTMLCanvasElement | undefined;
  dispose(): void;
}

// Compatibility exports: callers can continue importing these from the renderer boundary.
export { createThreeCamera, createThreeGeometry, createThreeScene };

export class ThreeGraphics3DRenderer implements Graphics3DRenderer {
  private renderer: THREE.WebGLRenderer | undefined;
  private container: HTMLElement | undefined;

  mount(container: HTMLElement, preserveDrawingBuffer = false): void {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.resize();
    container.appendChild(this.renderer.domElement);
  }

  render(
    world: Graphics3DWorld,
    camera: Graphics3DCamera,
    view?: Pick<Graphics3DView, "visibility">,
    options?: Graphics3DRenderOptions,
  ): THREE.Scene {
    const scene = createThreeScene(world, view);
    if (options?.background !== undefined) scene.background = new THREE.Color(options.background);
    if (!this.renderer) return scene;

    const width = options?.width ?? this.container?.clientWidth ?? 1;
    const height = options?.height ?? this.container?.clientHeight ?? 1;
    this.renderer.setPixelRatio(options?.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.renderer.render(scene, createThreeCamera(camera, width / height));
    return scene;
  }

  resize(width = this.container?.clientWidth || 1, height = this.container?.clientHeight || 1): void {
    this.renderer?.setSize(Math.max(1, width), Math.max(1, height), false);
  }

  getCanvas(): HTMLCanvasElement | undefined {
    return this.renderer?.domElement;
  }

  dispose(): void {
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = undefined;
    this.container = undefined;
  }
}
