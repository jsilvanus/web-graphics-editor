import type { Gradient, GradientStop } from "./types";

export const defaultGradient = (type: Gradient["type"] = "linear"): Gradient => ({
  type,
  angle: 90,
  cx: 50,
  cy: 50,
  stops: [
    { offset: 0, color: "#ffffff", opacity: 1 },
    { offset: 1, color: "#000000", opacity: 1 },
  ],
});

function color(stop: GradientStop) {
  return stop.opacity == null || stop.opacity >= 1 ? stop.color : `color-mix(in srgb, ${stop.color} ${Math.round(stop.opacity * 100)}%, transparent)`;
}

export function gradientToCss(g?: Gradient): string {
  if (!g || g.stops.length < 2) return "none";
  const stops = [...g.stops].sort((a,b)=>a.offset-b.offset).map(s=>`${color(s)} ${Math.round(Math.max(0,Math.min(1,s.offset))*100)}%`).join(", ");
  if (g.type === "radial") return `radial-gradient(circle at ${g.cx ?? 50}% ${g.cy ?? 50}%, ${stops})`;
  return `linear-gradient(${g.angle ?? 90}deg, ${stops})`;
}
