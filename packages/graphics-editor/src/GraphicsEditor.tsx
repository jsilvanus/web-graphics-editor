import { useCallback, useEffect, useRef, useState } from "react";
import { GraphicsEditorCanvas } from "./components/GraphicsEditorCanvas";
import { GraphicsEditorToolbar } from "./components/GraphicsEditorToolbar";
import { SceneTimelinePanel } from "./components/SceneTimeline";
import { LayerList } from "./components/LayerList";
import { LayerProperties } from "./components/properties/LayerProperties";
import { Graphics3DRenderSettingsPanel } from "./components/Graphics3DRenderSettingsPanel";
import { KEYFRAMES } from "./constants";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useCanvasViewport } from "./hooks/useCanvasViewport";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useEditorTransaction } from "./hooks/useEditorTransaction";
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
import type { GraphicsAsset, GraphicsEditorProps, GraphicsDocument, Graphics3DView, Graphics3DCamera } from "./types";

export function GraphicsEditor({ document: initialDocument, assets = [], onChange }: GraphicsEditorProps) {
  const { document, setDocument, executeCommand, undo, redo, canUndo, canRedo, resetHistory, history } = useEditorHistory(initialDocument);
  const initialDocumentRef = useRef(initialDocument);
  const { selectedIds, primaryId, select, clear } = useEditorSelection(document.layers[0]?.id ?? null);
  const [grid, setGrid] = useState(false), [safe, setSafe] = useState(false), [aspectLock, setAspectLock] = useState(true), [assetPicker, setAssetPicker] = useState(false);
  const artboardRef = useRef<HTMLDivElement>(null);
  const viewport = useCanvasViewport(document.width, document.height);
  const { timeline, setTimeline, seek, changeTimeline } = useGraphicsEditorTimeline(initialDocument.timeline ?? createDefaultTimeline());
  const [playing, setPlaying] = useState(false);
  const projectAssets = useProjectAssets(document, assets);
  const commit = useCallback((next: GraphicsDocument) => setDocument(next, true), [setDocument]);
  const transientChange = useCallback((next: GraphicsDocument) => setDocument(next, false), [setDocument]);
  const transaction = useEditorTransaction(commit);
  const { updateLayer, updateStyle } = useLayerOperations(executeCommand, document);
  const commands = useLayerCommands(document, executeCommand, selectedIds, primaryId, select, clear);
  const interaction = useCanvasInteraction(document, artboardRef, grid, aspectLock, transientChange, selectedIds);
  const drawing = useEditorDrawing(document, commit, select, clear);
  const { add3DView, update3DView } = use3DViews(document, commit, select);
  const { saveWegra, openWegra } = useWegraIO(document, timeline, history, resetHistory, setTimeline, clear);
  useTimelinePlayback(playing, setPlaying, setTimeline, timeline);
  const animatedLayers = useAnimatedLayers(document, timeline);
  const { changeLayer, changeStyle } = useAnimatedLayerEditing(updateLayer, updateStyle, setTimeline, timeline.currentTime);

  useEffect(() => { onChange?.({ ...document, timeline }); }, [document, timeline, onChange]);
  useEffect(() => { if (initialDocumentRef.current === initialDocument) return; initialDocumentRef.current = initialDocument; setTimeline(initialDocument.timeline ?? createDefaultTimeline()); resetHistory(initialDocument); }, [initialDocument, resetHistory, setTimeline]);

  const selectedLayer = animatedLayers.find(layer => layer.id === primaryId) ?? null;
  const selected3DView = selectedLayer?.type === "3d-view" ? document.views3d?.find(view => view.id === selectedLayer.view3dId) : undefined;
  const selected3DWorld = selected3DView ? document.worlds3d?.find(world => world.id === selected3DView.worldId) : undefined;
  const addFont = useCallback((asset: GraphicsAsset) => { if (!primaryId) return; setDocument(d => ({ ...d, assets: [...(d.assets ?? []).filter(a => a.id !== asset.id), asset] })); updateLayer(primaryId, { textStyle: { ...(selectedLayer?.textStyle ?? {}), fontAssetId: asset.id, fontFamily: String(asset.metadata?.family ?? asset.name) } }); }, [primaryId, selectedLayer, setDocument, updateLayer]);
  const onCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => { if (drawing.activeTool === "select") return; drawing.onPointerDown(event, artboardRef); }, [drawing]);
  const onCanvasPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => { drawing.onPointerMove(event, artboardRef); if (drawing.drawingRef.current?.tool === "line") return; interaction.pointerMove(event); }, [drawing, interaction]);
  const onCanvasPointerUp = useCallback(() => { if (drawing.drawingRef.current?.tool === "line") drawing.finishDrawing(); else interaction.pointerUp(); }, [drawing, interaction]);
  const onLayerPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, id: string, kind: string, handle?: string) => { if (drawing.activeTool !== "select") return; if (kind === "move") select(id, event.shiftKey); transaction.begin(document); interaction.pointerDown(event, id, kind, handle); }, [drawing.activeTool, select, transaction, document, interaction]);
  const total = timelineDuration(timeline);
  const selectedCamera = selected3DView && selected3DWorld ? selected3DWorld.cameras.find((camera: Graphics3DCamera) => camera.id === selected3DView.cameraId) : undefined;

  return <div className="graphics-editor"><style>{KEYFRAMES}</style><GraphicsEditorToolbar grid={grid} safe={safe} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onAdd={commands.addLayer} onAdd3DView={add3DView} onDuplicate={commands.duplicateSelected} onDelete={commands.deleteSelected} onToggleGrid={() => setGrid(v => !v)} onToggleSafe={() => setSafe(v => !v)} activeTool={drawing.activeTool} onTool={drawing.resetTool} onGroup={() => { const id = commands.group(selectedIds); if (id) select(id); }} onUngroup={() => { if (primaryId) commands.ungroup(primaryId); }} onForward={() => selectedIds.forEach(commands.bringForward)} onBackward={() => selectedIds.forEach(commands.sendBackward)} onFront={() => selectedIds.forEach(commands.bringToFront)} onBack={() => selectedIds.forEach(commands.sendToBack)} canGroup={selectedIds.size >= 2} canUngroup={!!primaryId && document.layers.some(layer => layer.id === primaryId && layer.type === "group")} onAlign={commands.applyAlign} onDistribute={commands.applyDistribute} canAlign={selectedIds.size >= 1} canDistribute={selectedIds.size >= 3} onSaveWegra={saveWegra} onOpenWegra={openWegra}/><div className="ge-layout"><GraphicsEditorCanvas artboardRef={artboardRef} viewportRef={viewport.hostRef} zoom={viewport.viewport.zoom} panX={viewport.viewport.panX} panY={viewport.viewport.panY} onWheel={viewport.onWheel} onViewportPointerDown={viewport.onPointerDown} onViewportPointerMove={viewport.onPointerMove} onViewportPointerUp={viewport.onPointerUp} onFit={viewport.fit} onZoomIn={viewport.zoomIn} onZoomOut={viewport.zoomOut} layers={animatedLayers} selectedIds={selectedIds} grid={grid} safe={safe} background={document.background ?? "#111"} worlds3d={document.worlds3d ?? []} views3d={document.views3d ?? []} onPointerMove={onCanvasPointerMove} onPointerUp={onCanvasPointerUp} onCanvasPointerDown={onCanvasPointerDown} onLayerPointerDown={onLayerPointerDown} drawing={drawing.drawing} onDrawingDoubleClick={drawing.finishDrawing} onPathNodes={(id, nodes) => updateLayer(id, { nodes, path: undefined })}/><aside className="ge-properties"><LayerList layers={document.layers} selectedIds={selectedIds} onSelect={id => select(id)}/>{selected3DView && selected3DWorld ? <div className="ge-section"><strong>{selected3DView.name ?? "3D View"}</strong><label style={{ display: "block", marginTop: 8 }}>World <select value={selected3DView.worldId} onChange={event => { const world = document.worlds3d?.find(item => item.id === event.target.value); update3DView(selected3DView.id, { worldId: event.target.value, cameraId: world?.cameras[0]?.id ?? selected3DView.cameraId }); }}>{(document.worlds3d ?? []).map(world => <option key={world.id} value={world.id}>{world.name ?? world.id}</option>)}</select></label><label style={{ display: "block", marginTop: 8 }}>Camera <select value={selected3DView.cameraId} onChange={event => update3DView(selected3DView.id, { cameraId: event.target.value })}>{selected3DWorld.cameras.map((camera: Graphics3DCamera) => <option key={camera.id} value={camera.id}>{camera.name ?? camera.id}</option>)}</select></label><label style={{ display: "block", marginTop: 8 }}>Render <select value={selected3DView.renderMode ?? "auto"} onChange={event => update3DView(selected3DView.id, { renderMode: event.target.value as Graphics3DView["renderMode"] })}><option value="auto">Auto / prerender in 2D</option><option value="prerender">Prerender</option><option value="live">Live</option></select></label><Graphics3DRenderSettingsPanel settings={selected3DView.renderSettings} onChange={renderSettings => update3DView(selected3DView.id, { renderSettings })}/><div style={{ marginTop: 10, fontSize: 12, opacity: .75 }}>World objects: {selected3DWorld.meshes.length}</div>{selectedCamera && <div style={{ marginTop: 6, fontSize: 12, opacity: .65 }}>Camera FOV: {selectedCamera.fov}°</div>}</div> : selectedLayer ? <LayerProperties layer={selectedLayer} assets={projectAssets} aspectLock={aspectLock} assetPicker={assetPicker} onLayer={changeLayer} onStyle={changeStyle} onChooseAsset={asset => { updateLayer(selectedLayer.id, { src: asset.url }); setAssetPicker(false); }} onToggleAssetPicker={() => setAssetPicker(v => !v)} onAspectLock={setAspectLock} onFont={addFont}/> : <div className="ge-section"><span>Select a layer.</span></div>}</aside></div><SceneTimelinePanel timeline={timeline} layers={document.layers} onChange={changeTimeline} onSeek={seek}/><div className="ge-playback"><button onClick={() => seek(0)}>⏮</button><button onClick={() => setPlaying(v => !v)}>{playing ? "⏸" : "▶"}</button><span>{timeline.currentTime.toFixed(2)}s / {total.toFixed(2)}s</span></div></div>;
}

export const defaultGraphicsDocument: GraphicsDocument = { width: 1920, height: 1080, background: "#111", layers: [{ id: "title", type: "text", x: 160, y: 300, width: 1600, height: 180, text: "Hello graphics editor", style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" } }] };
