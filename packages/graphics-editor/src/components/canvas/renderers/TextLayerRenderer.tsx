import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Layer, TextRun } from "../../../types";
import { pathCommandsToD, nodesToD, styleValue } from "../../../geometry";

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
function runsToHtml(runs: TextRun[]) { return runs.map(run => `<span style="${run.fontWeight ? `font-weight:${run.fontWeight};` : ""}${run.fontStyle ? `font-style:${run.fontStyle};` : ""}${run.fontFamily ? `font-family:${escapeHtml(run.fontFamily)};` : ""}${run.fontSize ? `font-size:${run.fontSize}px;` : ""}${run.color ? `color:${escapeHtml(run.color)};` : ""}${run.letterSpacing ? `letter-spacing:${escapeHtml(String(run.letterSpacing))};` : ""}">${escapeHtml(run.text).replace(/\n/g, "<br>")}</span>`).join(""); }
function domToRuns(root: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];
  const visit = (node: Node, inherited: Omit<TextRun, "text"> = {}) => {
    if (node.nodeType === Node.TEXT_NODE) { const text = node.textContent ?? ""; if (text) runs.push({ text, ...inherited }); return; }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") { runs.push({ text: "\n", ...inherited }); return; }
    const next = { ...inherited } as Omit<TextRun, "text">;
    const style = node.style;
    if (node.tagName === "B" || node.tagName === "STRONG" || style.fontWeight) next.fontWeight = style.fontWeight || "700";
    if (node.tagName === "I" || node.tagName === "EM" || style.fontStyle) next.fontStyle = style.fontStyle === "italic" ? "italic" : "italic";
    if (style.fontFamily) next.fontFamily = style.fontFamily;
    if (style.fontSize) { const parsed = Number.parseFloat(style.fontSize); if (Number.isFinite(parsed)) next.fontSize = parsed; }
    if (style.color) next.color = style.color;
    if (style.letterSpacing) next.letterSpacing = style.letterSpacing;
    for (const child of Array.from(node.childNodes)) visit(child, next);
  };
  visit(root);
  return runs;
}
function normalizeRuns(runs: TextRun[]) { const result: TextRun[] = []; for (const run of runs) { if (!run.text) continue; const previous = result[result.length - 1]; const same = previous && JSON.stringify({ ...previous, text: undefined }) === JSON.stringify({ ...run, text: undefined }); if (same) previous.text += run.text; else result.push({ ...run }); } return result; }

export function TextLayerRenderer({ layer, layers = [], onTextCommit, onTextRunsCommit }: { layer: Layer; layers?: Layer[]; onTextCommit?: (text: string) => void; onTextRunsCommit?: (runs: TextRun[] | undefined) => void }) {
  const text = layer.textStyle ?? {};
  const align = text.textAlign ?? styleValue(layer, "text-align", "left");
  const textPathLayerId = styleValue(layer, "text-path-layer-id", "");
  const textPathStartOffset = Number.parseFloat(styleValue(layer, "text-path-start-offset", "0"));
  const pathLayer = textPathLayerId ? layers.find(candidate => candidate.id === textPathLayerId && (candidate.type === "path" || candidate.type === "line")) : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.text ?? "");
  const editorRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef(layer.text ?? "");
  const cancelRef = useRef(false);
  const style: CSSProperties = { width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: editing ? "auto" : "none", overflow: text.overflow ?? (text.wrap === "none" ? "visible" : "hidden"), display: "flex", flexDirection: "column", justifyContent: text.verticalAlign === "middle" ? "center" : text.verticalAlign === "bottom" ? "flex-end" : "flex-start", textAlign: align as CSSProperties["textAlign"], fontFamily: text.fontFamily ?? styleValue(layer, "font-family", "Arial, sans-serif"), fontSize: text.fontSize ?? Number.parseFloat(styleValue(layer, "font-size", "72")), fontWeight: text.fontWeight ?? styleValue(layer, "font-weight", "400"), fontStyle: text.fontStyle ?? "normal", lineHeight: text.lineHeight ?? 1.2, letterSpacing: text.letterSpacing ?? "0px", whiteSpace: text.wrap === "none" ? "pre" : "pre-wrap", overflowWrap: text.wrap === "character" ? "anywhere" : "break-word", color: styleValue(layer, "color", "#fff"), userSelect: editing ? "text" : "none", cursor: editing ? "text" : "default" };

  useEffect(() => { if (!editing) { setDraft(layer.text ?? ""); originalRef.current = layer.text ?? ""; } }, [layer.text, editing]);
  useEffect(() => { if (!editing || !editorRef.current) return; editorRef.current.innerHTML = layer.textRuns?.length ? runsToHtml(layer.textRuns) : escapeHtml(draft).replace(/\n/g, "<br>"); editorRef.current.focus(); const selection = window.getSelection(); if (selection) { const range = document.createRange(); range.selectNodeContents(editorRef.current); range.collapse(false); selection.removeAllRanges(); selection.addRange(range); } }, [editing]);

  const finishEditing = (commit: boolean) => { const value = commit ? (editorRef.current?.textContent ?? draft) : originalRef.current; const runs = commit && editorRef.current ? normalizeRuns(domToRuns(editorRef.current)) : undefined; setDraft(value); setEditing(false); if (commit) { if (value !== originalRef.current) onTextCommit?.(value); if (runs?.length) onTextRunsCommit?.(runs); else onTextRunsCommit?.(undefined); } };
  const format = (command: "bold" | "italic") => { editorRef.current?.focus(); document.execCommand(command); setDraft(editorRef.current?.textContent ?? draft); };
  const beginEdit = (event: React.MouseEvent) => { event.stopPropagation(); originalRef.current = layer.text ?? ""; setDraft(layer.text ?? ""); setEditing(true); };

  if (editing || !pathLayer) {
    if (!editing) return <div style={style} onDoubleClick={beginEdit}>{layer.textRuns?.length ? layer.textRuns.map((run, index) => <span key={index} style={{ fontFamily: run.fontFamily, fontSize: run.fontSize, fontWeight: run.fontWeight, fontStyle: run.fontStyle, color: run.color, letterSpacing: run.letterSpacing }}>{run.text}</span>) : layer.text}</div>;
    return <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 2, display: "flex", gap: 3, padding: 3, background: "rgba(20,20,20,.9)", borderRadius: 4 }} onPointerDown={event => event.preventDefault()}><button type="button" title="Bold" onMouseDown={event => { event.preventDefault(); format("bold"); }}>B</button><button type="button" title="Italic" onMouseDown={event => { event.preventDefault(); format("italic"); }}>I</button></div>
      <div ref={editorRef} style={{ ...style, outline: "1px dashed currentColor", paddingTop: 28 }} contentEditable role="textbox" aria-label="Edit rich text" aria-multiline="true" suppressContentEditableWarning onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onInput={event => setDraft(event.currentTarget.textContent ?? "")} onBlur={() => { if (cancelRef.current) { cancelRef.current = false; return; } finishEditing(true); }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); cancelRef.current = true; finishEditing(false); } }} />
    </div>;
  }

  const d = pathLayer.nodes?.length ? nodesToD(pathLayer.nodes, pathLayer.closed) : pathLayer.path || (pathLayer.pathCommands ? pathCommandsToD(pathLayer.pathCommands) : "");
  const sx = layer.width ? pathLayer.width / layer.width : 1;
  const sy = layer.height ? pathLayer.height / layer.height : 1;
  const tx = pathLayer.x - layer.x;
  const ty = pathLayer.y - layer.y;
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const offset = Number.isFinite(textPathStartOffset) ? textPathStartOffset : 0;
  const runs = layer.textRuns?.length ? layer.textRuns : [{ text: layer.text ?? "" }];
  return <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(layer.width, 1)} ${Math.max(layer.height, 1)}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible", pointerEvents: "auto" }} onDoubleClick={beginEdit}><defs><path id={`${layer.id}-text-path`} d={d} transform={`translate(${tx} ${ty}) scale(${sx} ${sy})`} /></defs><text textAnchor={anchor} fontFamily={style.fontFamily} fontSize={style.fontSize} fontWeight={style.fontWeight} fontStyle={style.fontStyle} fill={style.color} letterSpacing={style.letterSpacing}><textPath href={`#${layer.id}-text-path`} startOffset={`${offset}%`}>{runs.map((run, index) => <tspan key={index} fontFamily={run.fontFamily} fontSize={run.fontSize} fontWeight={run.fontWeight} fontStyle={run.fontStyle} fill={run.color} letterSpacing={run.letterSpacing}>{run.text}</tspan>)}</textPath></text></svg>;
}
