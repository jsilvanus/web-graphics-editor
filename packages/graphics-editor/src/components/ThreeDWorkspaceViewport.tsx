import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DWorld } from "../types";
import { createThreeGeometry } from "../3d-renderer";
import { makeWorkspaceCamera } from "../3d-workspace-camera";
import { updateWorldCamera, updateWorldMesh } from "../3d-workspace-model";
import {
  createThreeDMeshEditController,
  type MeshEditMode,
  type ThreeDMeshEditController,
} from "./ThreeDMeshEditOverlay";
import { ThreeDMeshEditControls } from "./ThreeDMeshEditControls";

type TransformMode = "translate" | "rotate" | "scale";
type Vec3 = [number, number, number];

export interface ThreeDWorkspaceViewportProps {
  world: Graphics3DWorld;
  cameraId: string;
  selectedId: string | null;
  mode: TransformMode;
  editCamera: boolean;
  onModeChange: (mode: TransformMode) => void;
  onSelect: (id: string | null) => void;
  onChange: (world: Graphics3DWorld) => void;
}

/** Everything the imperative Three.js scene needs from the latest React render. */
interface ViewportInputs extends ThreeDWorkspaceViewportProps {
  meshEditMode: MeshEditMode;
  lookThrough: boolean;
}

/** Imperative handle to the scene created once per mount. */
interface ViewportScene {
  sync: () => void;
  frameSelection: () => void;
  meshEdit: ThreeDMeshEditController;
  transform: TransformControls;
  meshObject: (id: string) => THREE.Mesh | undefined;
}

const DEFAULT_MESH_COLOR = "#78a9ff";
const CAMERA_GIZMO_DEPTH = 1.5;

/**
 * Interactive 3D editing viewport.
 *
 * The viewport renders through its own editor camera (orbit with the mouse). The world's stored
 * cameras are shown as camera gizmos; "edit camera" attaches the transform gizmo to the active one,
 * and "look through" renders from it.
 */
export function ThreeDWorkspaceViewport(props: ThreeDWorkspaceViewportProps) {
  const { selectedId, mode, editCamera, onModeChange } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ViewportScene | null>(null);
  const [meshEditController, setMeshEditController] = useState<ThreeDMeshEditController | null>(null);
  const [meshEditMode, setMeshEditModeState] = useState<MeshEditMode>("object");
  const [lookThrough, setLookThrough] = useState(false);

  const inputsRef = useRef<ViewportInputs>({ ...props, meshEditMode, lookThrough });
  inputsRef.current = { ...props, meshEditMode, lookThrough };

  // Build the Three.js scene once per mount. Everything that changes later is read from inputsRef.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const inputs = () => inputsRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#15171b");
    scene.add(new THREE.GridHelper(20, 20, 0x555555, 0x333333), new THREE.AxesHelper(2));

    const editorCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    editorCamera.position.set(9, 7, 11);
    editorCamera.lookAt(0, 0, 0);

    const orbit = new OrbitControls(editorCamera, renderer.domElement);
    orbit.enableDamping = true;

    const transform = new TransformControls(editorCamera, renderer.domElement);
    scene.add(transform.getHelper());

    const meshObjects = new Map<string, THREE.Mesh>();
    const lightObjects = new Map<string, THREE.Light>();
    // Each stored camera has a real camera (used for "camera view") and a short-range child copy that the
    // gizmo draws, so the frustum stays readable instead of stretching out to the far plane.
    const cameraObjects = new Map<
      string,
      { camera: THREE.Camera; gizmoCamera: THREE.Camera; helper: THREE.CameraHelper }
    >();
    const fallbackLights = [new THREE.AmbientLight("#ffffff", 1.1), new THREE.DirectionalLight("#ffffff", 2)];
    fallbackLights[1].position.set(5, 8, 6);
    const selectionHelper = new THREE.BoxHelper(new THREE.Object3D(), 0xffff00);
    selectionHelper.visible = false;
    scene.add(selectionHelper);

    let meshEditDragging = false;
    const meshEdit = createThreeDMeshEditController(
      scene,
      editorCamera,
      renderer,
      geometry => {
        const { world, selectedId: id, onChange } = inputs();
        if (!id || !world.meshes.some(item => item.id === id)) return;
        onChange(updateWorldMesh(world, id, { geometry }));
      },
      extracted => {
        const { world, selectedId: sourceId, onChange, onSelect } = inputs();
        if (!sourceId) return;
        const id = `${sourceId}-extract-${Date.now()}`;
        onChange({
          ...world,
          meshes: [...world.meshes, { ...extracted, id, name: `${extracted.name ?? "Mesh"} extract` }],
        });
        onSelect(id);
      },
      dragging => {
        meshEditDragging = dragging;
        orbit.enabled = !dragging;
      },
    );
    setMeshEditController(meshEdit);

    const syncLights = (lights: Graphics3DLight[]) => {
      for (const light of lights) {
        let object = lightObjects.get(light.id);
        if (object && object.userData.lightType !== light.type) {
          scene.remove(object);
          object.dispose();
          object = undefined;
        }
        if (!object) {
          object = createLight(light.type);
          object.userData.lightType = light.type;
          scene.add(object);
          if (object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight)
            scene.add(object.target);
          lightObjects.set(light.id, object);
        }
        object.color.set(light.color ?? "#ffffff");
        object.intensity = light.intensity ?? 1;
        if (light.position) object.position.set(...light.position);
        if (light.rotation) object.rotation.set(...light.rotation);
        if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight)
          object.distance = light.distance ?? 0;
        if (object instanceof THREE.SpotLight) {
          object.angle = light.angle ?? 0.5;
          object.penumbra = light.penumbra ?? 0;
        }
      }
      for (const [id, object] of lightObjects)
        if (!lights.some(light => light.id === id)) {
          scene.remove(object);
          if (object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight)
            scene.remove(object.target);
          object.dispose();
          lightObjects.delete(id);
        }
      for (const fallback of fallbackLights) {
        if (lights.length) scene.remove(fallback);
        else if (!fallback.parent) scene.add(fallback);
      }
    };

    const syncMeshes = (meshes: Graphics3DMesh[]) => {
      for (const mesh of meshes) {
        let object = meshObjects.get(mesh.id);
        if (!object) {
          object = new THREE.Mesh(createThreeGeometry(mesh), new THREE.MeshStandardMaterial());
          object.userData.graphics3DId = mesh.id;
          object.userData.geometrySource = mesh.geometry;
          scene.add(object);
          meshObjects.set(mesh.id, object);
        } else if (object.userData.geometrySource !== mesh.geometry) {
          object.geometry.dispose();
          object.geometry = createThreeGeometry(mesh);
          object.userData.geometrySource = mesh.geometry;
        }
        object.name = mesh.name ?? mesh.id;
        object.position.set(...mesh.transform.position);
        object.rotation.set(...mesh.transform.rotation);
        object.scale.set(...mesh.transform.scale);
        object.visible = mesh.visible !== false;
        const material = object.material as THREE.MeshStandardMaterial;
        material.color.set(mesh.material?.color ?? DEFAULT_MESH_COLOR);
        material.roughness = mesh.material?.roughness ?? 0.75;
        material.metalness = mesh.material?.metalness ?? 0;
        material.wireframe = mesh.material?.wireframe ?? false;
        const flatShading = !mesh.material?.smoothShading;
        if (material.flatShading !== flatShading) {
          material.flatShading = flatShading;
          material.needsUpdate = true;
        }
        material.opacity = mesh.material?.opacity ?? mesh.opacity ?? 1;
        material.transparent = material.opacity < 1;
      }
      for (const [id, object] of meshObjects)
        if (!meshes.some(mesh => mesh.id === id)) {
          if (transform.object === object) transform.detach();
          scene.remove(object);
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
          meshObjects.delete(id);
        }
    };

    const syncCameras = (cameras: Graphics3DCamera[], activeId: string) => {
      for (const data of cameras) {
        let entry = cameraObjects.get(data.id);
        if (entry && entry.camera.userData.projection !== data.projection) {
          scene.remove(entry.camera, entry.helper);
          entry.helper.dispose();
          entry = undefined;
        }
        if (!entry) {
          const camera = makeWorkspaceCamera(data, aspect());
          camera.userData.projection = data.projection;
          camera.userData.graphics3DCameraId = data.id;
          const gizmoCamera = makeWorkspaceCamera(
            { ...data, position: [0, 0, 0], rotation: [0, 0, 0], near: 0.05, far: CAMERA_GIZMO_DEPTH },
            aspect(),
          );
          camera.add(gizmoCamera);
          const helper = new THREE.CameraHelper(gizmoCamera);
          scene.add(camera, helper);
          entry = { camera, gizmoCamera, helper };
          cameraObjects.set(data.id, entry);
        }
        // Don't fight the gizmo while the user is dragging this camera.
        if (!(transform.dragging && transform.object === entry.camera)) {
          entry.camera.position.set(...data.position);
          entry.camera.rotation.set(...data.rotation);
        }
        if (entry.camera instanceof THREE.PerspectiveCamera) {
          entry.camera.fov = data.fov ?? 50;
          entry.camera.near = data.near ?? 0.1;
          entry.camera.far = data.far ?? 2000;
        }
        if (entry.gizmoCamera instanceof THREE.PerspectiveCamera) entry.gizmoCamera.fov = data.fov ?? 50;
        updateProjection(entry.camera, aspect());
        updateProjection(entry.gizmoCamera, aspect());
        entry.camera.updateMatrixWorld();
        entry.helper.update();
        // Hide the gizmo of the camera we are looking through.
        entry.helper.visible = !(inputs().lookThrough && data.id === activeId);
      }
      for (const [id, entry] of cameraObjects)
        if (!cameras.some(camera => camera.id === id)) {
          if (transform.object === entry.camera) transform.detach();
          scene.remove(entry.camera, entry.helper);
          entry.helper.dispose();
          cameraObjects.delete(id);
        }
    };

    const syncTransformAttachment = () => {
      const { selectedId: id, editCamera: editingCamera, cameraId, meshEditMode: editMode, mode } = inputs();
      transform.setMode(editingCamera && mode === "scale" ? "translate" : mode);
      const target = editingCamera
        ? cameraObjects.get(cameraId)?.camera
        : editMode === "object" && id
          ? meshObjects.get(id)
          : undefined;
      if (target) {
        if (transform.object !== target) transform.attach(target);
      } else if (transform.object) transform.detach();
    };

    const syncSelectionHelper = () => {
      const { selectedId: id, editCamera: editingCamera, meshEditMode: editMode } = inputs();
      const selected = id ? meshObjects.get(id) : undefined;
      selectionHelper.visible = Boolean(selected && editMode === "object" && !editingCamera);
      if (selected && selectionHelper.visible) selectionHelper.setFromObject(selected);
    };

    const sync = () => {
      const { world, cameraId, selectedId: id, meshEditMode: editMode } = inputs();
      syncLights(world.lights ?? []);
      syncMeshes(world.meshes);
      syncCameras(world.cameras, cameraId);
      syncTransformAttachment();
      syncSelectionHelper();
      if (editMode !== "object" && !meshEditDragging)
        meshEdit.updateData(id ? world.meshes.find(item => item.id === id) : undefined);
    };

    const aspect = () => (host.clientWidth || 1) / (host.clientHeight || 1);

    const frameSelection = () => {
      const id = inputs().selectedId;
      const object = id ? meshObjects.get(id) : undefined;
      if (!object) return;
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const radius = Math.max(box.getSize(new THREE.Vector3()).length() * 0.6, 1);
      const direction = editorCamera.position.clone().sub(center).normalize();
      orbit.target.copy(center);
      editorCamera.position.copy(center).add(direction.multiplyScalar(radius * 2));
    };

    // Object picking (mesh editing does its own picking while a sub-object mode is active).
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownAt: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      host.focus({ preventScroll: true });
      pointerDownAt = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = pointerDownAt;
      pointerDownAt = null;
      // Treat as a click only if the pointer barely moved (i.e. not an orbit drag).
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;
      const { editCamera: editingCamera, meshEditMode: editMode, lookThrough: looking, onSelect } = inputs();
      if (transform.dragging || editingCamera || editMode !== "object" || looking) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, editorCamera);
      const hit = raycaster.intersectObjects([...meshObjects.values()].filter(object => object.visible))[0];
      onSelect((hit?.object.userData.graphics3DId as string | undefined) ?? null);
    };

    const onGizmoDragging = (event: { value: unknown }) => {
      orbit.enabled = event.value !== true;
    };
    const onGizmoChange = () => {
      const {
        world,
        cameraId,
        selectedId: id,
        editCamera: editingCamera,
        meshEditMode: editMode,
        onChange,
      } = inputs();
      const object = transform.object;
      if (!object) return;
      if (editingCamera) {
        if (!world.cameras.some(camera => camera.id === cameraId)) return;
        onChange(
          updateWorldCamera(world, cameraId, {
            position: object.position.toArray() as Vec3,
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
          }),
        );
        return;
      }
      if (editMode !== "object" || !id || !world.meshes.some(mesh => mesh.id === id)) return;
      onChange(
        updateWorldMesh(world, id, {
          transform: {
            position: object.position.toArray() as Vec3,
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: object.scale.toArray() as Vec3,
          },
        }),
      );
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    transform.addEventListener("dragging-changed", onGizmoDragging);
    transform.addEventListener("objectChange", onGizmoChange);

    const resize = () => {
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
      updateProjection(editorCamera, aspect());
      for (const entry of cameraObjects.values()) {
        updateProjection(entry.camera, aspect());
        updateProjection(entry.gizmoCamera, aspect());
        entry.helper.update();
      }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const { lookThrough: looking, cameraId } = inputs();
      const viewCamera = (looking && cameraObjects.get(cameraId)?.camera) || editorCamera;
      orbit.enabled = !looking && !transform.dragging && !meshEditDragging;
      orbit.update();
      if (selectionHelper.visible) selectionHelper.update();
      renderer.render(scene, viewCamera);
    };
    animate();

    sceneRef.current = {
      sync,
      frameSelection,
      meshEdit,
      transform,
      meshObject: id => meshObjects.get(id),
    };
    sync();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      transform.removeEventListener("dragging-changed", onGizmoDragging);
      transform.removeEventListener("objectChange", onGizmoChange);
      meshEdit.dispose();
      setMeshEditController(null);
      sceneRef.current = null;
      orbit.dispose();
      transform.detach();
      transform.dispose();
      selectionHelper.dispose();
      for (const object of meshObjects.values()) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
      for (const light of lightObjects.values()) light.dispose();
      for (const entry of cameraObjects.values()) entry.helper.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Push every React-side change into the scene.
  useEffect(() => {
    sceneRef.current?.sync();
  });

  // Leaving the selected mesh (or switching to camera editing) ends sub-object editing.
  useEffect(() => {
    sceneRef.current?.meshEdit.setMesh(undefined, undefined);
    sceneRef.current?.meshEdit.setMode("object");
    setMeshEditModeState("object");
  }, [selectedId, editCamera]);

  const setMeshEditMode = (next: MeshEditMode) => {
    const viewport = sceneRef.current;
    if (!viewport || editCamera || !selectedId) return;
    const data = props.world.meshes.find(mesh => mesh.id === selectedId);
    const object = viewport.meshObject(selectedId);
    if (next !== "object") viewport.transform.detach();
    viewport.meshEdit.setMode(next);
    viewport.meshEdit.setMesh(next === "object" ? undefined : object, next === "object" ? undefined : data);
    setMeshEditModeState(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select")) return;
    const viewport = sceneRef.current;
    const key = event.key.toLowerCase();
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && meshEditMode !== "object" && (key === "z" || key === "y")) {
      event.preventDefault();
      if (key === "y" || event.shiftKey) viewport?.meshEdit.redo();
      else viewport?.meshEdit.undo();
      return;
    }
    if (modifier) return;
    if (key === "w" && meshEditMode === "object") onModeChange("translate");
    else if (key === "e" && meshEditMode === "object") onModeChange("rotate");
    else if (key === "r" && meshEditMode === "object") onModeChange("scale");
    else if (key === "f") viewport?.frameSelection();
    else if (key === "1") setMeshEditMode("object");
    else if (key === "2") setMeshEditMode("vertices");
    else if (key === "3") setMeshEditMode("edges");
    else if (key === "4") setMeshEditMode("faces");
    else if (key === "escape") {
      if (meshEditMode !== "object") setMeshEditMode("object");
      else props.onSelect(null);
    } else if (
      (key === "delete" || key === "backspace") &&
      selectedId &&
      !editCamera &&
      meshEditMode === "object"
    ) {
      event.preventDefault();
      props.onChange({ ...props.world, meshes: props.world.meshes.filter(mesh => mesh.id !== selectedId) });
      props.onSelect(null);
    }
  };

  const subObjectDisabled = !selectedId || editCamera;
  return (
    <div
      ref={hostRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ minHeight: 520, height: "100%", position: "relative", outline: "none", overflow: "hidden" }}
    >
      <div style={toolbarStyle}>
        {(["object", "vertices", "edges", "faces"] as const).map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setMeshEditMode(item)}
            disabled={item !== "object" && subObjectDisabled}
            aria-pressed={meshEditMode === item}
            title={`${item[0].toUpperCase()}${item.slice(1)} mode (${index + 1})`}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
        <span style={{ width: 8 }} />
        {(
          [
            ["translate", "Move", "W"],
            ["rotate", "Rotate", "E"],
            ["scale", "Scale", "R"],
          ] as const
        ).map(([value, label, key]) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            disabled={meshEditMode !== "object" || (editCamera && value === "scale")}
            aria-pressed={mode === value}
            title={`${label} (${key})`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => sceneRef.current?.frameSelection()}
          disabled={!selectedId}
          title="Frame selected (F)"
        >
          Frame
        </button>
        <span style={{ width: 8 }} />
        <button
          type="button"
          onClick={() => setLookThrough(value => !value)}
          aria-pressed={lookThrough}
          title="Render through the active scene camera"
        >
          {lookThrough ? "Editor view" : "Camera view"}
        </button>
      </div>
      <div style={hintStyle}>
        Drag: orbit · Right-drag: pan · Wheel: zoom · W/E/R · F frame · 1–4 modes · Del remove · Esc
      </div>
      <ThreeDMeshEditControls
        mode={meshEditMode}
        controller={meshEditController}
        disabled={subObjectDisabled}
      />
    </div>
  );
}

function createLight(type: Graphics3DLight["type"]): THREE.Light {
  if (type === "ambient") return new THREE.AmbientLight();
  if (type === "point") return new THREE.PointLight();
  if (type === "spot") return new THREE.SpotLight();
  return new THREE.DirectionalLight();
}

function updateProjection(camera: THREE.Camera, aspect: number) {
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.OrthographicCamera) {
    const halfHeight = (camera.top - camera.bottom) / 2;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.updateProjectionMatrix();
  }
}

const toolbarStyle: CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  right: 10,
  zIndex: 2,
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
};

const hintStyle: CSSProperties = {
  position: "absolute",
  right: 10,
  bottom: 10,
  zIndex: 2,
  padding: "4px 7px",
  fontSize: 11,
  background: "rgba(16,18,22,.75)",
  borderRadius: 4,
  pointerEvents: "none",
};
