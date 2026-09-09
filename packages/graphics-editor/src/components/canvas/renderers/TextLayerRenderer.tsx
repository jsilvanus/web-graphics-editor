import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Layer } from "../../../types";
import { pathCommandsToD, nodesToD, styleValue } from "../../../geometry";

export function TextLayerRenderer({ layer, layers = [], onTextCommit }: { layer: Layer; layers?: Layer[]; onTextCommit?: (text: string) => void }) {
  const text = layer.textStyle ?? {};
  const align = text.textAlign ?? styleValue(layer, "text-align", "left");
  const textPathLayerId = styleValue(layer, "text-path-layer-id", "");
  const textPathStartOffset = Number.parseFloat(styleValue(layer, "text-path-start-offset", "0"));
  const pathLayer = textPathLayerId ? layers.find(candidate => candidate.id === textPathLayerId && (candidate.type === "path" || candidate.type === "line")) : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.text ?? "");
  const editorRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef(layer.text ?? "");

  useEffect(() => {
    if (!editing) { setDraft(layer.text ?? ""); originalRef.current = layer.text ?? ""; }
  }, [layer.text, editing]);

  useEffect(() => {
    if (!editing || !editorRef.current) return;
    editorRef.current.textContent = draft;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection) { const range = document.createRange(); range.selectNodeContents(editorRef.current); range.collapse(false); selection.removeAllRanges(); selection.addRange(range); }
  }, [editing]);

  const finishEditing = (commit: boolean) => { const value = commit ? draft : originalRef.current; setDraft(value); setEditing(false); if (commit && value !== originalRef.current) onTextCommit?.(value); };
  const style: CSSProperties = {
    width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: editing ? "auto" : "none",
    overflow: text.overflow ?? (text.wrap === "none" ? "visible" : "hidden"), display: "flex", flexDirection: "column",
    justifyContent: text.verticalAlign === "middle" ? "center" : text.verticalAlign === "bottom" ? "flex-end" : "flex-start",
    textAlign: align as CSSProperties["textAlign"], fontFamily: text.fontFamily ?? styleValue(layer, "font-family", "Arial, sans-serif"),
    fontSize: text.fontSize ?? Number.parseFloat(styleValue(layer, "font-size", "72")), fontWeight: text.fontWeight ?? styleValue(layer, "font-weight", "400"),
    fontStyle: text.fontStyle ?? "normal", lineHeight: text.lineHeight ?? 1.2, letterSpacing: text.letterSpacing ?? "0px",
    whiteSpace: text.wrap === "none" ? "pre" : "pre-wrap", overflowWrap: text.wrap === "character" ? "anywhere" : "break-word",
    color: styleValue(layer, "color", "#fff"), userSelect: editing ? "text" : "none", cursor: editing ? "text" : "default"
  };

  if (editing || !pathLayer) {
    if (!editing) return <div style={style} onDoubleClick={event => { event.stopPropagation(); originalRef.current = layer.text ?? ""; setDraft(layer.text ?? ""); setEditing(true); }}>{layer.text}</div>;
    return <div ref={editorRef} style={style} contentEditable role="textbox" aria-label="Edit text" aria-multiline="true" suppressContentEditableWarning onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onInput={event => setDraft(event.currentTarget.textContent ?? "")} onBlur={() => finishEditing(true)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); finishEditing(false); } }} />;
  }

  const d = pathLayer.nodes?.length ? nodesToD(pathLayer.nodes, pathLayer.closed) : pathLayer.path || (pathLayer.pathCommands ? pathCommandsToD(pathLayer.pathCommands) : "");
  const sx = layer.width ? pathLayer.width / layer.width : 1;
  const sy = layer.height ? pathLayer.height / layer.height : 1;
  const tx = pathLayer.x - layer.x;
  const ty = pathLayer.y - layer.y;
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const offset = Number.isFinite(textPathStartOffset) ? textPathStartOffset : 0;

  return <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible", pointerEvents: "auto" }} onDoubleClick={event => { event.stopPropagation(); originalRef.current = layer.text ?? ""; setDraft(layer.text ?? ""); setEditing(true); }}>
    <defs><path id={`${layer.id}-text-path`} d={d} transform={`translate(${tx} ${ty}) scale(${sx} ${sy})`} /></defs>
    <text textAnchor={anchor} fontFamily={style.fontFamily} fontSize={style.fontSize} fontWeight={style.fontWeight} fontStyle={style.fontStyle} fill={style.color} letterSpacing={style.letterSpacing}>
      <textPath href={`#${layer.id}-text-path`} startOffset={`${offset}%`}>{layer.text}</textPath>
    </text>
  </svg>;
}
