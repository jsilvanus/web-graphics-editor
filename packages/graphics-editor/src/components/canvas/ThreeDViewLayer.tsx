import { useEffect, useRef, useState } from "react";
import type { Layer, Graphics3DView, Graphics3DWorld } from "../../types";
import { ThreeGraphics3DRenderer } from "../../3d-renderer";

export interface ThreeDViewLayerProps {
  layer: Layer;
  view: Graphics3DView;
  world: Graphics3DWorld;
}

/** Renders a stored 3D camera view inside the ordinary 2D composition. */
export function ThreeDViewLayer({ layer, view, world }: ThreeDViewLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeGraphics3DRenderer | null>(null);
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  const renderKey = JSON.stringify({ world, cameraId: view.cameraId, visibility: view.visibility, w: layer.width, h: layer.height });
  const camera = world.cameras.find(item => item.id === view.cameraId);

  useEffect(() => {
    if (!hostRef.current || !camera) return;
    const renderer = new ThreeGraphics3DRenderer();
    rendererRef.current = renderer;
    renderer.mount(hostRef.current);
    renderer.render(world, camera, view, { pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [renderKey]);

  useEffect(() => {
    if (!hostRef.current || !camera || view.renderMode === "live") return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    const canvas = renderer.getCanvas();
    if (canvas) setCachedImage(canvas.toDataURL("image/png"));
  }, [renderKey, camera, view.renderMode]);

  if (!camera) return null;
  const mode = view.renderMode ?? "auto";
  const live = mode === "live";
  const image = cachedImage;

  return <div ref={hostRef} style={{ width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
    {!live && image && <img src={image} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }} />}
  </div>;
}
