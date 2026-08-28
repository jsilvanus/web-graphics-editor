import type { GraphicsDocument, Layer, PathCommand, PathNode } from "./types";
import { nodesToD } from "./geometry";

function esc(value: string) { return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function attrs(style: Record<string, string | number> = {}) { return Object.entries(style).map(([k, v]) => `${k}="${esc(String(v))}"`).join(" "); }
function layerSvg(layer: Layer): string {
  const transform = `translate(${layer.x} ${layer.y}) rotate(${layer.rotation ?? 0} ${layer.width / 2} ${layer.height / 2})`;
  const style = attrs(layer.style);
  if (layer.type === "path" || layer.type === "line") return `<path d="${esc(layer.nodes?.length ? nodesToD(layer.nodes, layer.closed) : layer.path ?? "")}" ${style ? style + " " : ""}transform="${transform}"/>`;
  if (layer.type === "rectangle") return `<rect x="0" y="0" width="${layer.width}" height="${layer.height}" ${style ? style + " " : ""}transform="${transform}"/>`;
  if (layer.type === "ellipse") return `<ellipse cx="${layer.width / 2}" cy="${layer.height / 2}" rx="${layer.width / 2}" ry="${layer.height / 2}" ${style ? style + " " : ""}transform="${transform}"/>`;
  if (layer.type === "image") return `<image href="${esc(layer.src ?? "")}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="none" ${style ? style + " " : ""}transform="${transform}"/>`;
  return `<text x="0" y="0" ${style ? style + " " : ""}transform="${transform}">${esc(layer.text ?? "")}</text>`;
}
export function exportSvg(document: GraphicsDocument): string { return `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">${document.background ? `<rect width="100%" height="100%" fill="${esc(document.background)}"/>` : ""}${document.layers.map(layerSvg).join("")}</svg>`; }

function parseStyle(el: Element): Record<string, string> { const result: Record<string, string> = {}; const style = el.getAttribute("style"); if (style) style.split(";").forEach(pair => { const [k, v] = pair.split(":"); if (k && v) result[k.trim()] = v.trim(); }); for (const name of ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "color", "font-size", "font-weight", "text-anchor"]) { const v = el.getAttribute(name); if (v != null) result[name] = v; } return result; }
function parsePathData(d: string): PathCommand[] { const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? []; let i = 0, cmd = "M", x = 0, y = 0; const out: PathCommand[] = []; const num = () => Number(tokens[i++]); while (i < tokens.length) { if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++]; const rel = cmd === cmd.toLowerCase(); const C = cmd.toUpperCase(); try { if (C === "M" || C === "L") { const nx = num(), ny = num(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; out.push({ type: C as "M" | "L", x, y }); cmd = C === "M" ? (rel ? "l" : "L") : cmd; } else if (C === "H") { const nx = num(); x = rel ? x + nx : nx; out.push({ type: "H", x }); } else if (C === "V") { const ny = num(); y = rel ? y + ny : ny; out.push({ type: "V", y }); } else if (C === "C") { const a=num(),b=num(),c=num(),d2=num(),nx=num(),ny=num(); out.push({ type:"C", x1:rel?x+a:a, y1:rel?y+b:b, x2:rel?x+c:c, y2:rel?y+d2:d2, x:rel?x+nx:nx, y:rel?y+ny:ny }); x=out[out.length-1].x as number; y=out[out.length-1].y as number; } else if (C === "Q") { const a=num(),b=num(),nx=num(),ny=num(); out.push({type:"Q",x1:rel?x+a:a,y1:rel?y+b:b,x:rel?x+nx:nx,y:rel?y+ny:ny}); x=out[out.length-1].x as number; y=out[out.length-1].y as number; } else if (C === "Z") out.push({type:"Z"}); else { i++; } } catch { break; } } return out; }
export function importSvg(svg: string): GraphicsDocument {
  if (typeof DOMParser === "undefined") throw new Error("SVG import requires DOMParser");
  const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") throw new Error("Invalid SVG document");
  const width = Number(root.getAttribute("width") ?? root.viewBox?.baseVal?.width ?? 1920) || 1920;
  const height = Number(root.getAttribute("height") ?? root.viewBox?.baseVal?.height ?? 1080) || 1080;
  const layers: Layer[] = [];
  root.querySelectorAll("path,rect,ellipse,text,image").forEach((el, index) => {
    const tag = el.tagName.toLowerCase(), style = parseStyle(el); const id = el.getAttribute("id") ?? `svg-${index}`;
    if (tag === "path") { const d = el.getAttribute("d") ?? ""; const commands = parsePathData(d); layers.push({ id, type:"path", x:0,y:0,width:width,height:height,path:d,pathCommands:commands,style }); }
    else if (tag === "rect") layers.push({id,type:"rectangle",x:Number(el.getAttribute("x")??0),y:Number(el.getAttribute("y")??0),width:Number(el.getAttribute("width")??0),height:Number(el.getAttribute("height")??0),style});
    else if (tag === "ellipse") layers.push({id,type:"ellipse",x:Number(el.getAttribute("cx")??0)-Number(el.getAttribute("rx")??0),y:Number(el.getAttribute("cy")??0)-Number(el.getAttribute("ry")??0),width:Number(el.getAttribute("rx")??0)*2,height:Number(el.getAttribute("ry")??0)*2,style});
    else if (tag === "text") layers.push({id,type:"text",x:Number(el.getAttribute("x")??0),y:Number(el.getAttribute("y")??0),width:width,height:100,text:el.textContent??"",style});
    else if (tag === "image") layers.push({id,type:"image",x:Number(el.getAttribute("x")??0),y:Number(el.getAttribute("y")??0),width:Number(el.getAttribute("width")??0),height:Number(el.getAttribute("height")??0),src:el.getAttribute("href")??el.getAttribute("xlink:href")??"",style});
  });
  return { width, height, layers };
}
