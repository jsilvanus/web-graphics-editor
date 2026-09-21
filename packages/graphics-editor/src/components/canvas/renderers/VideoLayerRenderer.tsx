import { useEffect, useRef } from "react";

export interface VideoLayerRendererProps {
  src: string;
  mediaTime: number;
}

export function VideoLayerRenderer({ src, mediaTime }: VideoLayerRendererProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const target = Math.max(0, Number.isFinite(mediaTime) ? mediaTime : 0);
    if (Math.abs(video.currentTime - target) > 0.05) {
      try { video.currentTime = target; } catch { /* media metadata may not be ready yet */ }
    }
  }, [mediaTime, src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      const target = Math.max(0, Number.isFinite(mediaTime) ? mediaTime : 0);
      try { video.currentTime = target; } catch { /* wait for metadata */ }
    };
    video.addEventListener("loadedmetadata", sync);
    return () => video.removeEventListener("loadedmetadata", sync);
  }, [mediaTime, src]);

  return <video
    ref={ref}
    src={src}
    muted
    playsInline
    preload="auto"
    autoPlay={false}
    controls={false}
    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
    aria-hidden="true"
  />;
}
