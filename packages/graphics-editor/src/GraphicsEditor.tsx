import { useCallback, useEffect, useRef, useState } from "react";
import { GraphicsEditorCanvas } from "./components/GraphicsEditorCanvas";
import { GraphicsEditorToolbar } from "./components/GraphicsEditorToolbar";
import { SceneTimelinePanel } from "./components/SceneTimeline";
import { CompositionTimelinePanel } from "./components/CompositionTimelinePanel";
import { WorldTimelinePanel } from "./components/WorldTimelinePanel";
import { LayerList } from "./components/LayerList";
import { LayerProperties } from "./components/properties/LayerProperties";
import { CompositionProperties } from "./components/properties/CompositionProperties";
import { Graphics3DRenderSettingsPanel } from "./components/Graphics3DRenderSettingsPanel";
import { KEYFRAMES } from "./constants";
import { EDITOR_STYLES } from "./styles";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useCanvasViewport } from "./hooks/useCanvasViewport";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useEditorTransaction } from "./hooks/useEditorTransaction";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { useLayerOperations } from "./hooks/useLayerOperations";
import { useLayerCommands } from "./hooks/useLayerCommands";
import {
  useGraphicsEditorTimeline,
  createDefaultTimeline,
  withDefaultTimeline,
} from "./hooks/useGraphicsEditorTimeline";
import { useTimelinePlayback } from "./hooks/useTimelinePlayback";
import { useAnimatedLayers } from "./hooks/useAnimatedLayers";
import { useAnimatedLayerEditing } from "./hooks/useAnimatedLayerEditing";
import { useEditorDrawing } from "./hooks/useEditorDrawing";
import { useProjectAssets } from "./hooks/useProjectAssets";
import { use3DViews } from "./hooks/use3DViews";
import { useWegraIO } from "./hooks/useWegraIO";
import { timelineDuration } from "./timeline";
import { deserializeGraphicsDocument, serializeGraphicsDocument } from "./serialization";
import { composeDocumentAtTime } from "./compositor";
import { evaluateCompositionAtTime } from "./composition-evaluator";
import { enterCompositionPath, exitCompositionPath } from "./composition-navigation";
import type {
  GraphicsAsset,
  GraphicsEditorProps,
  GraphicsDocument,
  Graphics3DView,
  Graphics3DCamera,
  TextRun,
} from "./types";

export function GraphicsEditor({ document: initialDocument, assets = [], onChange }: GraphicsEditorProps) {
  const {
    document,
    setDocument,
    commitFrom,
    getDocument,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    history,
  } = useEditorHistory(withDefaultTimeline(initialDocument));
  const transientDocumentChange = useCallback(
    (next: GraphicsDocument) => setDocument(next, false),
    [setDocument],
  );
  useEditorKeyboard(undo, redo);
  const [compositionPath, setCompositionPath] = useState<string[]>([]);
  const [compositionTime, setCompositionTime] = useState(0);
  const activeCompositionId = compositionPath[compositionPath.length - 1];
  const activeComposition = activeCompositionId
    ? document.compositions?.find(c => c.id === activeCompositionId)
    : undefined;
  const editorLayers = activeComposition
    ? document.layers.filter(layer => activeComposition.layerIds.includes(layer.id))
    : document.layers;
  const initialDocumentRef = useRef(initialDocument);
  const { selectedIds, primaryId, select, clear } = useEditorSelection(document.layers[0]?.id ?? null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      if (!selectedIds.size || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "[", "]"].includes(event.key)) return;
      const step = event.shiftKey ? 10 : 1;
      const ids = new Set(selectedIds);
      const editableIds = activeCompositionId ? new Set(activeComposition?.layerIds ?? []) : ids;
      const next = {
        ...document,
        layers: document.layers.map(layer => {
          if (!ids.has(layer.id) || (activeCompositionId && !editableIds.has(layer.id))) return layer;
          if (event.key === "ArrowLeft") return { ...layer, x: layer.x - step };
          if (event.key === "ArrowRight") return { ...layer, x: layer.x + step };
          if (event.key === "ArrowUp") return { ...layer, y: layer.y - step };
          if (event.key === "ArrowDown") return { ...layer, y: layer.y + step };
          const delta = event.key === "[" ? -15 : 15;
          return { ...layer, rotation: (layer.rotation ?? 0) + delta };
        }),
      };
      event.preventDefault();
      setDocument(next, true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document, selectedIds, setDocument]);
  const [grid, setGrid] = useState(false),
    [safe, setSafe] = useState(false),
    [aspectLock, setAspectLock] = useState(true),
    [assetPicker, setAssetPicker] = useState(false);
  const [styleClipboard, setStyleClipboard] = useState<Record<string, string | number> | null>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    additive: boolean;
  } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );
  const viewport = useCanvasViewport(document.width, document.height);
  const canvasPoint = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: (event.clientX - rect.left) / viewport.viewport.zoom,
        y: (event.clientY - rect.top) / viewport.viewport.zoom,
      };
    },
    [viewport.viewport.zoom],
  );
  const {
    timeline,
    seek,
    changeTimeline,
    context,
    enterWorld,
    exitWorld,
    world,
    worldTimeline,
    worldCurrentTime,
    updateWorldTimeline,
  } = useGraphicsEditorTimeline(document, executeCommand, transientDocumentChange);
  const [playing, setPlaying] = useState(false);
  const [compositionPlaying, setCompositionPlaying] = useState(false);
  const projectAssets = useProjectAssets(document, assets);
  const newDocument = useCallback(() => {
    if (!window.confirm("Create a new graphics document? Unsaved changes will be lost.")) return;
    const next: GraphicsDocument = { ...defaultGraphicsDocument, layers: [] };
    resetHistory(next);
    clear();
    viewport.fit();
  }, [resetHistory, clear, viewport]);
  const exportJson = useCallback(() => {
    const blob = new Blob([serializeGraphicsDocument({ ...document, timeline })], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "graphics.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [document, timeline]);
  const importJson = useCallback(
    async (file: File) => {
      try {
        const imported = deserializeGraphicsDocument(await file.text());
        resetHistory(withDefaultTimeline(imported));
        clear();
        viewport.fit();
      } catch (error) {
        console.error("Failed to open JSON document", error);
        window.alert("Could not open this graphics JSON document.");
      }
    },
    [resetHistory, clear, viewport],
  );
  const commit = useCallback((next: GraphicsDocument) => setDocument(next, true), [setDocument]);
  const transientChange = transientDocumentChange;
  const transaction = useEditorTransaction(getDocument, commitFrom);
  const { updateLayer, updateStyle } = useLayerOperations(executeCommand, getDocument);
  const commands = useLayerCommands(
    document,
    executeCommand,
    selectedIds,
    primaryId,
    select,
    clear,
    getDocument,
  );
  const interaction = useCanvasInteraction(
    document,
    artboardRef,
    grid,
    aspectLock,
    transientChange,
    selectedIds,
    activeCompositionId ? compositionTime : timeline.currentTime,
  );
  const drawing = useEditorDrawing(document, commit, select, clear);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.size) {
        event.preventDefault();
        commands.deleteSelected();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && selectedIds.size) {
        event.preventDefault();
        commands.duplicateSelected();
        return;
      }
      if (event.key === "Enter" && drawing.drawingRef.current) {
        event.preventDefault();
        drawing.finishDrawing();
        return;
      }
      if (event.key === "Escape") {
        drawing.resetTool("select");
        setMarquee(null);
        marqueeRef.current = null;
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        viewport.fit();
        return;
      }
      if (event.key === "1") {
        event.preventDefault();
        viewport.setZoom(1);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        viewport.zoomIn();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "-") {
        event.preventDefault();
        viewport.zoomOut();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawing, viewport, commands, selectedIds]);
  const { add3DView, update3DView } = use3DViews(document, commit, select);
  const { saveWegra, openWegra } = useWegraIO(document, timeline, history, resetHistory, clear);
  const transientSeek = useCallback(
    (next: typeof timeline) => setDocument(current => ({ ...current, timeline: next }), false),
    [setDocument],
  );
  useTimelinePlayback(
    playing && context.kind === "main" && !activeCompositionId,
    setPlaying,
    transientSeek,
    timeline,
  );
  useEffect(() => {
    if (!activeCompositionId || !activeComposition) {
      setCompositionPlaying(false);
      return;
    }
    if (!compositionPlaying) return;
    let frame = 0;
    let last: number | undefined;
    const tick = (now: number) => {
      if (last === undefined) last = now;
      const dt = (now - last) / 1000;
      last = now;
      setCompositionTime(previous => {
        const duration = Math.max(0, activeComposition.duration ?? 10);
        const next = previous + dt;
        if (next >= duration) {
          if (activeComposition.loop && duration > 0) return next % duration;
          setCompositionPlaying(false);
          return duration;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeCompositionId, activeComposition, compositionPlaying]);
  const animatedLayers = useAnimatedLayers(document, timeline);
  const editorTime = activeCompositionId ? compositionTime : timeline.currentTime;
  const { changeLayer, changeStyle } = useAnimatedLayerEditing(document, executeCommand, editorTime);
  // Documents this editor has reported through onChange. A host that feeds them back in as the
  // `document` prop (the usual controlled pattern) must not reset the editor or its history.
  const emittedDocumentsRef = useRef(new WeakSet<GraphicsDocument>());
  useEffect(() => {
    emittedDocumentsRef.current.add(document);
    onChange?.(document);
  }, [document, onChange]);
  useEffect(() => {
    if (initialDocumentRef.current === initialDocument) return;
    initialDocumentRef.current = initialDocument;
    if (emittedDocumentsRef.current.has(initialDocument)) return;
    resetHistory({ ...initialDocument, timeline: initialDocument.timeline ?? createDefaultTimeline() });
  }, [initialDocument, resetHistory]);
  const createComposition = useCallback(() => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const id = "composition-" + Date.now();
    const composition = {
      id,
      name: "Composition " + ((document.compositions?.length ?? 0) + 1),
      layerIds: ids,
      duration: 10,
      loop: false,
      timeline: { tracks: [] },
    };
    const instance = {
      id: "layer-" + Date.now(),
      type: "composition" as const,
      x: 0,
      y: 0,
      width: document.width,
      height: document.height,
      compositionId: id,
      name: composition.name,
    };
    setDocument(
      {
        ...document,
        compositions: [...(document.compositions ?? []), composition],
        layers: [...document.layers, instance],
      },
      true,
    );
    select(instance.id);
  }, [selectedIds, document, setDocument, select]);
  const selectedLayer = editorLayers.find(layer => layer.id === primaryId) ?? null;
  const enterComposition = useCallback(
    (id: string) => {
      if (!document.compositions?.some(c => c.id === id)) return;
      setCompositionPath(path => enterCompositionPath(path, id));
      setCompositionTime(0);
      setCompositionPlaying(false);
    },
    [document.compositions],
  );
  const exitComposition = useCallback(() => {
    setCompositionPath(path => exitCompositionPath(path));
    setCompositionTime(0);
    setCompositionPlaying(false);
  }, []);
  const copyStyle = useCallback(() => {
    if (!selectedLayer) return;
    setStyleClipboard(selectedLayer.style ? { ...selectedLayer.style } : {});
  }, [selectedLayer]);
  const pasteStyle = useCallback(() => {
    if (!styleClipboard || !selectedIds.size) return;
    selectedIds.forEach(id => updateLayer(id, { style: { ...styleClipboard } }));
  }, [styleClipboard, selectedIds, updateLayer]);
  const selected3DView =
    selectedLayer?.type === "3d-view"
      ? document.views3d?.find(view => view.id === selectedLayer.view3dId)
      : undefined;
  const selected3DWorld = selected3DView
    ? document.worlds3d?.find(world => world.id === selected3DView.worldId)
    : undefined;
  const addFont = useCallback(
    (asset: GraphicsAsset) => {
      if (!primaryId) return;
      setDocument(d => ({ ...d, assets: [...(d.assets ?? []).filter(a => a.id !== asset.id), asset] }));
      updateLayer(primaryId, {
        textStyle: {
          ...(selectedLayer?.textStyle ?? {}),
          fontAssetId: asset.id,
          fontFamily: String(asset.metadata?.family ?? asset.name),
        },
      });
    },
    [primaryId, selectedLayer, setDocument, updateLayer],
  );
  const commitText = useCallback(
    (id: string, text: string) => {
      updateLayer(id, { text });
    },
    [updateLayer],
  );
  const commitTextRuns = useCallback(
    (id: string, runs: TextRun[] | undefined) => {
      updateLayer(id, { textRuns: runs });
    },
    [updateLayer],
  );
  const onCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (drawing.activeTool === "select") {
        if (event.target !== event.currentTarget) return;
        const point = canvasPoint(event);
        if (!point) return;
        marqueeRef.current = {
          x: point.x,
          y: point.y,
          startX: point.x,
          startY: point.y,
          additive: event.shiftKey,
        };
        setMarquee({ x: point.x, y: point.y, width: 0, height: 0 });
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        return;
      }
      drawing.onPointerDown(event, artboardRef);
    },
    [drawing, canvasPoint],
  );
  const onCanvasPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const m = marqueeRef.current;
      if (m) {
        const point = canvasPoint(event);
        if (point) {
          m.x = point.x;
          m.y = point.y;
          setMarquee({
            x: Math.min(m.startX, point.x),
            y: Math.min(m.startY, point.y),
            width: Math.abs(point.x - m.startX),
            height: Math.abs(point.y - m.startY),
          });
        }
        return;
      }
      drawing.onPointerMove(event, artboardRef);
      if (drawing.drawingRef.current?.tool === "line") return;
      interaction.pointerMove(event);
    },
    [drawing, interaction, canvasPoint],
  );
  const onCanvasPointerUp = useCallback(() => {
    const m = marqueeRef.current;
    if (m) {
      marqueeRef.current = null;
      setMarquee(null);
      const x = Math.min(m.startX, m.x),
        y = Math.min(m.startY, m.y);
      const right = Math.max(m.startX, m.x),
        bottom = Math.max(m.startY, m.y);
      const hit = editorLayers
        .filter(
          layer =>
            layer.visible !== false &&
            layer.x < right &&
            layer.x + layer.width > x &&
            layer.y < bottom &&
            layer.y + layer.height > y,
        )
        .map(layer => layer.id);
      if (m.additive) hit.forEach(id => select(id, true));
      else if (hit.length) hit.forEach((id, i) => select(id, i > 0));
      else clear();
      return;
    }
    const drawingTool = drawing.drawingRef.current?.tool;
    if (drawingTool === "line" || drawingTool === "freehand" || drawingTool === "star")
      drawing.finishDrawing();
    else {
      interaction.pointerUp();
      transaction.end();
    }
  }, [drawing, interaction, transaction, document, select, clear]);
  const onLayerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, id: string, kind: string, handle?: string) => {
      if (drawing.activeTool !== "select") return;
      if (kind === "move") select(id, event.shiftKey);
      transaction.begin();
      interaction.pointerDown(event, id, kind, handle);
    },
    [drawing.activeTool, select, transaction, document, interaction],
  );
  const total = timelineDuration(timeline);
  const compositorFrame = activeCompositionId
    ? (() => {
        const evaluation = evaluateCompositionAtTime(document, activeCompositionId, compositionTime);
        return evaluation
          ? {
              kind: "composition" as const,
              compositionId: evaluation.composition.id,
              time: evaluation.time,
              timeDomain: evaluation.timeDomain,
              layers: evaluation.layers,
              renderTree: evaluation.renderTree,
              videos: evaluation.videos,
              views3d: evaluation.views3d,
              evaluation,
            }
          : composeDocumentAtTime(document, timeline.currentTime);
      })()
    : composeDocumentAtTime(document, timeline.currentTime);
  const selectedCamera =
    selected3DView && selected3DWorld
      ? selected3DWorld.cameras.find((camera: Graphics3DCamera) => camera.id === selected3DView.cameraId)
      : undefined;
  const editSelectedWorld = useCallback(() => {
    if (selected3DWorld) enterWorld(selected3DWorld.id);
  }, [enterWorld, selected3DWorld]);
  return (
    <div className="graphics-editor">
      <style>{EDITOR_STYLES + KEYFRAMES}</style>
      <GraphicsEditorToolbar
        grid={grid}
        safe={safe}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAdd={commands.addLayer}
        onAdd3DView={add3DView}
        onDuplicate={commands.duplicateSelected}
        onDelete={commands.deleteSelected}
        onToggleGrid={() => setGrid(v => !v)}
        onToggleSafe={() => setSafe(v => !v)}
        activeTool={drawing.activeTool}
        onTool={drawing.resetTool}
        onGroup={() => {
          const id = commands.group(selectedIds);
          if (id) select(id);
        }}
        onUngroup={() => {
          if (primaryId) commands.ungroup(primaryId);
        }}
        onForward={() => selectedIds.forEach(commands.bringForward)}
        onBackward={() => selectedIds.forEach(commands.sendBackward)}
        onFront={() => selectedIds.forEach(commands.bringToFront)}
        onBack={() => selectedIds.forEach(commands.sendToBack)}
        canGroup={selectedIds.size >= 2}
        canUngroup={
          !!primaryId && document.layers.some(layer => layer.id === primaryId && layer.type === "group")
        }
        onAlign={commands.applyAlign}
        onDistribute={commands.applyDistribute}
        onBoolean={commands.applyBoolean}
        onJoinPaths={commands.applyJoinPaths}
        onFlattenPath={() => primaryId && commands.flattenPath(primaryId)}
        canFlatten={
          !!primaryId &&
          document.layers.some(
            layer => layer.id === primaryId && layer.type === "path" && !!layer.nodes?.length,
          )
        }
        onConvertToPath={() => primaryId && commands.convertToPath(primaryId)}
        onConvertToShape={() => primaryId && commands.convertToShape(primaryId)}
        onCopyStyle={copyStyle}
        onPasteStyle={pasteStyle}
        canPasteStyle={!!styleClipboard && selectedIds.size > 0}
        canJoinPaths={
          selectedIds.size === 2 &&
          [...selectedIds].every(id => {
            const l = document.layers.find(x => x.id === id);
            return l?.type === "path" && !l.closed;
          })
        }
        canAlign={selectedIds.size >= 1}
        canDistribute={selectedIds.size >= 3}
        onSaveWegra={saveWegra}
        onOpenWegra={openWegra}
        onNewDocument={newDocument}
        onExportJson={exportJson}
        onImportJson={importJson}
      />
      <div className="ge-layout">
        <GraphicsEditorCanvas
          frame={compositorFrame}
          marquee={marquee ?? undefined}
          artboardRef={artboardRef}
          viewportRef={viewport.hostRef}
          zoom={viewport.viewport.zoom}
          panX={viewport.viewport.panX}
          panY={viewport.viewport.panY}
          onViewportPointerDown={viewport.onPointerDown}
          onViewportPointerMove={viewport.onPointerMove}
          onViewportPointerUp={viewport.onPointerUp}
          onFit={viewport.fit}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          onZoomReset={() => viewport.setZoom(1)}
          layers={
            activeComposition
              ? animatedLayers.filter(layer => activeComposition.layerIds.includes(layer.id))
              : animatedLayers
          }
          selectedIds={selectedIds}
          grid={grid}
          safe={safe}
          background={document.background ?? "#111"}
          width={document.width}
          height={document.height}
          worlds3d={document.worlds3d ?? []}
          views3d={document.views3d ?? []}
          assets={projectAssets}
          currentTime={editorTime}
          onSelectLayer={select}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onCanvasPointerDown={onCanvasPointerDown}
          onLayerPointerDown={onLayerPointerDown}
          onTextCommit={commitText}
          onTextRunsCommit={commitTextRuns}
          drawing={drawing.drawing}
          onDrawingDoubleClick={drawing.finishDrawing}
          onPathNodes={(id, nodes) => updateLayer(id, { nodes, path: undefined })}
        />
        <aside className="ge-properties">
          <div className="ge-section">
            <b>Composition</b>
            <button type="button" disabled={!selectedIds.size} onClick={createComposition}>
              Create composition from selection
            </button>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setCompositionPath([]);
                  setCompositionTime(0);
                  setCompositionPlaying(false);
                }}
              >
                Main
              </button>
              {compositionPath.map((id, index) => {
                const c = document.compositions?.find(item => item.id === id);
                return (
                  <span key={id}>
                    /{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setCompositionPath(compositionPath.slice(0, index + 1));
                        setCompositionTime(0);
                        setCompositionPlaying(false);
                      }}
                    >
                      {c?.name ?? id}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
          <LayerList
            layers={document.layers}
            compositions={document.compositions ?? []}
            selectedIds={selectedIds}
            onSelect={id => {
              const layer = document.layers.find(item => item.id === id);
              if (layer?.locked) return;
              select(id);
            }}
            onMove={commands.move}
            onDuplicate={id => {
              const ids = new Set([id]);
              const copies = commands.duplicate(ids);
              if (copies[0]) select(copies[0]);
            }}
            onDelete={id => {
              commands.remove(new Set([id]));
              if (selectedIds.has(id)) clear();
            }}
            onForward={commands.bringForward}
            onBackward={commands.sendBackward}
            onFront={commands.bringToFront}
            onBack={commands.sendToBack}
            onGroup={() => {
              const id = commands.group(selectedIds);
              if (id) select(id);
            }}
            onUngroup={commands.ungroup}
            onToggleVisibility={id =>
              setDocument(
                d => ({
                  ...d,
                  layers: d.layers.map(layer =>
                    layer.id === id ? { ...layer, visible: layer.visible === false ? true : false } : layer,
                  ),
                }),
                true,
              )
            }
            onToggleLock={id =>
              setDocument(
                d => ({
                  ...d,
                  layers: d.layers.map(layer =>
                    layer.id === id ? { ...layer, locked: !layer.locked } : layer,
                  ),
                }),
                true,
              )
            }
            onRename={(id, name) => {
              setDocument(
                d => ({
                  ...d,
                  layers: d.layers.map(layer =>
                    layer.id === id ? { ...layer, name: name.trim() || undefined } : layer,
                  ),
                }),
                true,
              );
            }}
          />
          {selectedLayer?.type === "composition" ? (
            <CompositionProperties
              layer={selectedLayer}
              composition={document.compositions?.find(c => c.id === selectedLayer.compositionId)}
              compositions={document.compositions ?? []}
              onLayer={patch => changeLayer(selectedLayer.id, patch)}
              onComposition={patch => {
                const id = selectedLayer.compositionId;
                if (!id) return;
                setDocument(
                  d => ({
                    ...d,
                    compositions: (d.compositions ?? []).map(c => (c.id === id ? { ...c, ...patch } : c)),
                  }),
                  true,
                );
              }}
              onEnter={() => selectedLayer.compositionId && enterComposition(selectedLayer.compositionId)}
            />
          ) : selected3DView && selected3DWorld ? (
            <div className="ge-section">
              <strong>{selected3DView.name ?? "3D View"}</strong>
              <label style={{ display: "block", marginTop: 8 }}>
                World{" "}
                <select
                  value={selected3DView.worldId}
                  onChange={event => {
                    const selectedWorld = document.worlds3d?.find(item => item.id === event.target.value);
                    update3DView(selected3DView.id, {
                      worldId: event.target.value,
                      cameraId: selectedWorld?.cameras[0]?.id ?? selected3DView.cameraId,
                    });
                  }}
                >
                  {(document.worlds3d ?? []).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name ?? item.id}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8 }}>
                Camera{" "}
                <select
                  value={selected3DView.cameraId}
                  onChange={event => update3DView(selected3DView.id, { cameraId: event.target.value })}
                >
                  {selected3DWorld.cameras.map((camera: Graphics3DCamera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name ?? camera.id}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8 }}>
                Render{" "}
                <select
                  value={selected3DView.renderMode ?? "auto"}
                  onChange={event =>
                    update3DView(selected3DView.id, {
                      renderMode: event.target.value as Graphics3DView["renderMode"],
                    })
                  }
                >
                  <option value="auto">Auto / prerender in 2D</option>
                  <option value="prerender">Prerender</option>
                  <option value="live">Live</option>
                </select>
              </label>
              <Graphics3DRenderSettingsPanel
                settings={selected3DView.renderSettings}
                onChange={renderSettings => update3DView(selected3DView.id, { renderSettings })}
              />
              <button type="button" style={{ marginTop: 10, width: "100%" }} onClick={editSelectedWorld}>
                Edit World Animation
              </button>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                World objects: {selected3DWorld.meshes.length}
              </div>
              {selectedCamera && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
                  Camera FOV: {selectedCamera.fov}°
                </div>
              )}
            </div>
          ) : selectedLayer ? (
            <LayerProperties
              layer={selectedLayer}
              assets={projectAssets}
              aspectLock={aspectLock}
              assetPicker={assetPicker}
              onLayer={changeLayer}
              onStyle={changeStyle}
              onChooseAsset={asset => {
                updateLayer(selectedLayer.id, { src: asset.url });
                setAssetPicker(false);
              }}
              onToggleAssetPicker={() => setAssetPicker(v => !v)}
              onAspectLock={setAspectLock}
              onFont={addFont}
              onAsset={asset =>
                setDocument(d => ({
                  ...d,
                  assets: [...(d.assets ?? []).filter(a => a.id !== asset.id), asset],
                }))
              }
              onOffset={(_id, distance) => commands.applyOffset(distance)}
            />
          ) : (
            <div className="ge-section">
              <span>Select a layer.</span>
            </div>
          )}
        </aside>
      </div>
      {context.kind === "world" && world ? (
        <WorldTimelinePanel
          world={world}
          timeline={worldTimeline}
          currentTime={worldCurrentTime}
          onSeek={seek}
          onChange={updateWorldTimeline}
          onExit={exitWorld}
        />
      ) : activeComposition ? (
        <CompositionTimelinePanel
          composition={activeComposition}
          layers={document.layers.filter(layer => activeComposition.layerIds.includes(layer.id))}
          compositions={document.compositions ?? []}
          assets={document.assets ?? []}
          onLayerChange={layer =>
            setDocument(
              { ...document, layers: document.layers.map(item => (item.id === layer.id ? layer : item)) },
              true,
            )
          }
          currentTime={compositionTime}
          onSeek={time => setCompositionTime(Math.max(0, Math.min(activeComposition.duration ?? 10, time)))}
          onChange={composition =>
            setDocument(
              {
                ...document,
                compositions: (document.compositions ?? []).map(c =>
                  c.id === composition.id ? composition : c,
                ),
              },
              true,
            )
          }
        />
      ) : (
        <SceneTimelinePanel
          timeline={timeline}
          layers={document.layers}
          worlds3d={document.worlds3d ?? []}
          views3d={document.views3d ?? []}
          onChange={changeTimeline}
          onSeek={seek}
        />
      )}
      <div className="ge-playback">
        <button onClick={() => (activeCompositionId ? setCompositionTime(0) : seek(0))}>⏮</button>
        <button
          onClick={() => (activeCompositionId ? setCompositionPlaying(v => !v) : setPlaying(v => !v))}
          disabled={context.kind !== "main"}
        >
          {activeCompositionId ? (compositionPlaying ? "⏸" : "▶") : playing ? "⏸" : "▶"}
        </button>
        <span>
          {context.kind === "world"
            ? `${worldCurrentTime.toFixed(2)}s / ${(worldTimeline.duration ?? 0).toFixed(2)}s`
            : activeCompositionId
              ? `${compositionTime.toFixed(2)}s / ${(activeComposition?.duration ?? 10).toFixed(2)}s`
              : `${timeline.currentTime.toFixed(2)}s / ${total.toFixed(2)}s`}
        </span>
      </div>
    </div>
  );
}

export const defaultGraphicsDocument: GraphicsDocument = {
  width: 1920,
  height: 1080,
  background: "#111",
  layers: [
    {
      id: "title",
      type: "text",
      x: 160,
      y: 300,
      width: 1600,
      height: 180,
      text: "Hello graphics editor",
      style: { "font-size": "92px", "font-weight": 700, color: "#fff", "text-align": "center" },
    },
  ],
};
