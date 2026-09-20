import { useCallback, useEffect, useRef, useState } from "react";
import { GraphicsEditorCanvas } from "./components/GraphicsEditorCanvas";
import { GraphicsEditorToolbar } from "./components/GraphicsEditorToolbar";
import { SceneTimelinePanel } from "./components/SceneTimeline";
import { WorldTimelinePanel } from "./components/WorldTimelinePanel";
import { LayerList } from "./components/LayerList";
import { LayerProperties } from "./components/properties/LayerProperties";
import { Graphics3DRenderSettingsPanel } from "./components/Graphics3DRenderSettingsPanel";
import { KEYFRAMES } from "./constants";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useCanvasViewport } from "./hooks/useCanvasViewport";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useEditorTransaction } from "./hooks/useEditorTransaction";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { useLayerOperations } from "./hooks/useLayerOperations";
import { useLayerCommands } from "./hooks/useLayerCommands";
import { useGraphicsEditorTimeline, createDefaultTimeline } from "./hooks/useGraphicsEditorTimeline";
import { useTimelinePlayback } from "./hooks/useTimelinePlayback";
import { useAnimatedLayers } from "./hooks/useAnimatedLayers";
import { useAnimatedLayerEditing } from "./hooks/useAnimatedLayerEditing";
import { useEditorDrawing } from "./hooks/useEditorDrawing";
import { useProjectAssets } from "./hooks/useProjectAssets";
import { use3DViews } from "./hooks/use3DViews";
import { useWegraIO } from "./hooks/useWegraIO";
import { timelineDuration } from "./timeline";
import type { GraphicsAsset, GraphicsEditorProps, GraphicsDocument, Graphics3DView, Graphics3DCamera, TextRun } from "./types";

export function GraphicsEditor({ document: initialDocument, assets = [], onChange }: GraphicsEditorProps) {
  const { document, setDocument, executeCommand, undo, redo, canUndo, canRedo, resetHistory, history } = useEditorHistory(initialDocument);
  useEditorKeyboard(undo, redo);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedIds.size || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","[","]"].includes(event.key)) return;
      const step = event.shiftKey ? 10 : 1;
      const ids = new Set(selectedIds);
      const next = { ...document, layers: document.layers.map(layer => {
        if (!ids.has(layer.id)) return layer;
        if (event.key === "ArrowLeft") return { ...layer, x: layer.x - step };
        if (event.key === "ArrowRight") return { ...layer, x: layer.x + step };
        if (event.key === "ArrowUp") return { ...layer, y: layer.y - step };
        if (event.key === "ArrowDown") return { ...layer, y: layer.y + step };
        const delta = event.key === "[" ? -15 : 15;
        return { ...layer, rotation: (layer.rotation ?? 0) + delta };
      }) };
      event.preventDefault();
      setDocument(next, true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document, selectedIds, setDocument]);
  const initialDocumentRef = useRef(initialDocument);
  const { selectedIds, primaryId, select, clear } = useEditorSelection(document.layers[0]?.id ?? null);
  const [grid, setGrid] = useState(false), [safe, setSafe] = useState(false), [aspectLock, setAspectLock] = useState(true), [assetPicker, setAssetPicker] = useState(false);
  const artboardRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<{ x: number; y: number; startX: number; startY: number; additive: boolean } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasPoint = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: (event.clientX - rect.left) / viewport.viewport.zoom, y: (event.clientY - rect.top) / viewport.viewport.zoom };
  }, [viewport.viewport.zoom]);
  const viewport = useCanvasViewport(document.width, document.height);
  const { timeline, setTimeline, seek, changeTimeline, context, enterWorld, exitWorld, world, worldTimeline, worldCurrentTime, updateWorldTimeline } = useGraphicsEditorTimeline(document, executeCommand);
  const [playing, setPlaying] = useState(false);
  const projectAssets = useProjectAssets(document, assets);
  const commit = useCallback((next: GraphicsDocument) => setDocument(next, true), [setDocument]);
  const transientChange = useCallback((next: GraphicsDocument) => setDocument(next, false), [setDocument]);
  const transaction = useEditorTransaction(commit);
  const { updateLayer, updateStyle } = useLayerOperations(executeCommand, document);
  const commands = useLayerCommands(document, executeCommand, selectedIds, primaryId, select, clear);
  const interaction = useCanvasInteraction(document, artboardRef, grid, aspectLock, transientChange, selectedIds, timeline.currentTime);
  const drawing = useEditorDrawing(document, commit, select, clear);
  const { add3DView, update3DView } = use3DViews(document, commit, select);
  const { saveWegra, openWegra } = useWegraIO(document, timeline, history, resetHistory, setTimeline, clear);
  const transientSeek = useCallback((next: typeof timeline) => setDocument({ ...document, timeline: next }, false), [document, setDocument]);
  useTimelinePlayback(playing && context.kind === "main", setPlaying, transientSeek, timeline);
  const animatedLayers = useAnimatedLayers(document, timeline);
  const { changeLayer, changeStyle } = useAnimatedLayerEditing(document, executeCommand, timeline.currentTime);
  useEffect(() => { onChange?.(document); }, [document, onChange]);
  useEffect(() => { if (initialDocumentRef.current === initialDocument) return; initialDocumentRef.current = initialDocument; resetHistory({ ...initialDocument, timeline: initialDocument.timeline ?? createDefaultTimeline() }); }, [initialDocument, resetHistory]);
  const selectedLayer = animatedLayers.find(layer => layer.id === primaryId) ?? null;
  const selected3DView = selectedLayer?.type === "3d-view" ? document.views3d?.find(view => view.id === selectedLayer.view3dId) : undefined;
  const selected3DWorld = selected3DView ? document.worlds3d?.find(world => world.id === selected3DView.worldId) : undefined;
  const addFont = useCallback((asset: GraphicsAsset) => { if (!primaryId) return; setDocument(d => ({ ...d, assets: [...(d.assets ?? []).filter(a => a.id !== asset.id), asset] })); updateLayer(primaryId, { textStyle: { ...(selectedLayer?.textStyle ?? {}), fontAssetId: asset.id, fontFamily: String(asset.metadata?.family ?? asset.name) } }); }, [primaryId, selectedLayer, setDocument, updateLayer]);
  const commitText = useCallback((id: string, text: string) => { updateLayer(id, { text }); }, [updateLayer]);
  const commitTextRuns = useCallback((id: string, runs: TextRun[] | undefined) => { updateLayer(id, { textRuns: runs }); }, [updateLayer]);
  const onCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (drawing.activeTool === "select") {
      if (event.target !== event.currentTarget) return;
      const point = canvasPoint(event);
      if (!point) return;
      marqueeRef.current = { x: point.x, y: point.y, startX: point.x, startY: point.y, additive: event.shiftKey };
      setMarquee({ x: point.x, y: point.y, width: 0, height: 0 });
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      return;
    }
    drawing.onPointerDown(event, artboardRef);
  }, [drawing, canvasPoint]);
  const onCanvasPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const m = marqueeRef.current;
    if (m) {
      const point = canvasPoint(event);
      if (point) { m.x = point.x; m.y = point.y; setMarquee({ x: Math.min(m.startX, point.x), y: Math.min(m.startY, point.y), width: Math.abs(point.x - m.startX), height: Math.abs(point.y - m.startY) }); }
      return;
    }
    drawing.onPointerMove(event, artboardRef);
    if (drawing.drawingRef.current?.tool === "line") return;
    interaction.pointerMove(event);
  }, [drawing, interaction, canvasPoint]);
  const onCanvasPointerUp = useCallback(() => {
    const m = marqueeRef.current;
    if (m) {
      marqueeRef.current = null;
      setMarquee(null);
      const x = Math.min(m.startX, m.x), y = Math.min(m.startY, m.y);
      const right = Math.max(m.startX, m.x), bottom = Math.max(m.startY, m.y);
      const hit = document.layers.filter(layer => layer.visible !== false && layer.x < right && layer.x + layer.width > x && layer.y < bottom && layer.y + layer.height > y).map(layer => layer.id);
      if (m.additive) hit.forEach(id => select(id, true));
      else if (hit.length) hit.forEach((id, i) => select(id, i > 0));
      else clear();
      return;
    }
    if (drawing.drawingRef.current?.tool === "line") drawing.finishDrawing(); else { interaction.pointerUp(); transaction.end(document); }
  }, [drawing, interaction, transaction, document, select, clear]);
  const onLayerPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, id: string, kind: string, handle?: string) => { if (drawing.activeTool !== "select") return; if (kind === "move") select(id, event.shiftKey); transaction.begin(document); interaction.pointerDown(event, id, kind, handle); }, [drawing.activeTool, select, transaction, document, interaction]);
  const total = timelineDuration(timeline);
  const selectedCamera = selected3DView && selected3DWorld ? selected3DWorld.cameras.find((camera: Graphics3DCamera) => camera.id === selected3DView.cameraId) : undefined;
  const editSelectedWorld = useCallback(() => { if (selected3DWorld) enterWorld(selected3DWorld.id); }, [enterWorld, selected3DWorld]);
  return <div className="graphics-editor"><style>{KEYFRAMES}</style><GraphicsEditorToolbar grid={grid} safe={safe} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onAdd={commands.addLayer} onAdd3DView={add3DView} onDuplicate={commands.duplicateSelected} onDelete={commands.deleteSelected} onToggleGrid={() => setGrid(v => !v)} onToggleSafe={() => setSafe(v => !v)} activeTool={drawing.activeTool} onTool={drawing.resetTool} onGroup={() => { const id = commands.group(selectedIds); if (id) select(id); }} onUngroup={() => { if (primaryId) commands.ungroup(primaryId); }} onForward={() => selectedIds.forEach(commands.bringForward)} onBackward={() => selectedIds.forEach(commands.sendBackward)} onFront={() => selectedIds.forEach(commands.bringToFront)} onBack={() => selectedIds.forEach(commands.sendToBack)} canGroup={selectedIds.size >= 2} canUngroup={!!primaryId && document.layers.some(layer => layer.id === primaryId && layer.type === "group")} onAlign={commands.applyAlign} onDistribute={commands.applyDistribute} onBoolean={commands.applyBoolean} canAlign={selectedIds.size >= 1} canDistribute={selectedIds.size >= 3} onSaveWegra={saveWegra} onOpenWegra={openWegra}/><div className="ge-layout"><GraphicsEditorCanvas artboardRef={artboardRef} viewportRef={viewport.hostRef} zoom={viewport.viewport.zoom} panX={viewport.viewport.panX} panY={viewport.viewport.panY} onWheel={viewport.onWheel} onViewportPointerDown={viewport.onPointerDown} onViewportPointerMove={viewport.onPointerMove} onViewportPointerUp={viewport.onPointerUp} onFit={viewport.fit} onZoomIn={viewport.zoomIn} onZoomOut={viewport.zoomOut} layers={animatedLayers} selectedIds={selectedIds} grid={grid} safe={safe} background={document.background ?? "#111"} worlds3d={document.worlds3d ?? []} views3d={document.views3d ?? []} onPointerMove={onCanvasPointerMove} onPointerUp={onCanvasPointerUp} onCanvasPointerDown={onCanvasPointerDown} onLayerPointerDown={onLayerPointerDown} onTextCommit={commitText} onTextRunsCommit={commitTextRuns} drawing={drawing.drawing} onDrawingDoubleClick={drawing.finishDrawing} onPathNodes={(id, nodes) => updateLayer(id, { nodes, path: undefined })}/><aside className="ge-properties"><LayerList layers={document.layers} selectedIds={selectedIds} onSelect={id => { const layer = document.layers.find(item => item.id === id); if (layer?.locked) return; select(id); }} onForward={commands.bringForward} onBackward={commands.sendBackward} onFront={commands.bringToFront} onBack={commands.sendToBack} onGroup={() => { const id = commands.group(selectedIds); if (id) select(id); }} onUngroup={commands.ungroup} onToggleVisibility={id => setDocument(d => ({ ...d, layers: d.layers.map(layer => layer.id === id ? { ...layer, visible: layer.visible === false ? true : false } : layer) }), true)} onToggleLock={id => setDocument(d => ({ ...d, layers: d.layers.map(layer => layer.id === id ? { ...layer, locked: !layer.locked } : layer) }), true)} onRename={(id, name) => { if (!name.trim() || document.layers.some(layer => layer.id === name.trim() && layer.id !== id)) return; setDocument(d => ({ ...d, layers: d.layers.map(layer => layer.id === id ? { ...layer, id: name.trim() } : layer) }), true); }}/>{selected3DView && selected3DWorld ? <div className="ge-section"><strong>{selected3DView.name ?? "3D View"}</strong><label style={{ display: "block", marginTop: 8 }}>World <select value={selected3DView.worldId} onChange={event => { const selectedWorld = document.worlds3d?.find(item => item.id === event.target.value); update3DView(selected3DView.id, { worldId: event.target.value, cameraId: selectedWorld?.cameras[0]?.id ?? selected3DView.cameraId }); }}>{(document.worlds3d ?? []).map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</select></label><label style={{ display: "block", marginTop: 8 }}>Camera <select value={selected3DView.cameraId} onChange={event => update3DView(selected3DView.id, { cameraId: event.target.value })}>{selected3DWorld.cameras.map((camera: Graphics3DCamera) => <option key={camera.id} value={camera.id}>{camera.name ?? camera.id}</option>)}</select></label><label style={{ display: "block", marginTop: 8 }}>Render <select value={selected3DView.renderMode ?? "auto"} onChange={event => update3DView(selected3DView.id, { renderMode: event.target.value as Graphics3DView["renderMode"] })}><option value="auto">Auto / prerender in 2D</option><option value="prerender">Prerender</option><option value="live">Live</option></select></label><Graphics3DRenderSettingsPanel settings={selected3DView.renderSettings} onChange={renderSettings => update3DView(selected3DView.id, { renderSettings })}/><button type="button" style={{ marginTop: 10, width: "100%" }} onClick={editSelectedWorld}>Edit World Animation</button><div style={{ marginTop: 10, fontSize: 12, opacity: .75 }}>World objects: {selected3DWorld.meshes.length}</div>{selectedCamera && <div style={{ marginTop: 6, fontSize: 12, opacity: .65 }}>Camera FOV: {selectedCamera.fov}°</div>}</div> : selectedLayer ? <LayerProperties layer={selectedLayer} assets={projectAssets} aspectLock={aspectLock} assetPicker={assetPicker} onLayer={changeLayer} onStyle={changeStyle} onChooseAsset={asset => { updateLayer(selectedLayer.id, { src: asset.url }); setAssetPicker(false); }} onToggleAssetPicker={() => setAssetPicker(v => !v)} onAspectLock={setAspectLock} onFont={addFont}/> : <div className="ge-section"><span>Select a layer.</span></div>}</aside></div>{context.kind === "world" && world ? <WorldTimelinePanel world={world} timeline={worldTimeline} currentTime={worldCurrentTime} onSeek={seek} onChange={updateWorldTimeline} onExit={exitWorld}/> : <SceneTimelinePanel timeline={timeline} layers={document.layers} worlds3d={document.worlds3d ?? []} views3d={document.views3d ?? []} onChange={changeTimeline} onSeek={seek}/>}<div className="ge-playback"><button onClick={() => seek(0)}>⏮</button><button onClick={() => setPlaying(v => !v)} disabled={context.kind !== "main"}>{playing ? "⏸" : "▶"}</button><span>{context.kind === "world" ? `${worldCurrentTime.toFixed(2)}s / ${(worldTimeline.duration ?? 0).toFixed(2)}s` : `${timeline.currentTime.toFixed(2)}s / ${total.toFixed(2)}s`}</span></div></div>;
}

export const defaultGraphicsDocument: GraphicsDocument = { width: 1920, height: 1080, background: "#111", layers: [{ id: "title", type: "text", x: 160, y: 300, width: 1600, height: 180, text: "Hello graphics editor", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } }] };
