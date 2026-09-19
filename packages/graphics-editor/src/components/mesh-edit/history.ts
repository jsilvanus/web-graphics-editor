import type { Graphics3DMesh } from "../../types";
import type { FaceEditAction, MeshEditMode, MeshEditSelection } from "./types";

export interface MeshEditHistoryState {
  data: Graphics3DMesh;
  mode: MeshEditMode;
  faceAction: FaceEditAction;
  selection: {
    vertices: Set<number>;
    edges: Set<string>;
    faces: Set<number>;
  };
}

function cloneMesh(data: Graphics3DMesh): Graphics3DMesh {
  return {
    ...data,
    transform: {
      position: [...data.transform.position] as [number, number, number],
      rotation: [...data.transform.rotation] as [number, number, number],
      scale: [...data.transform.scale] as [number, number, number],
    },
    geometry: {
      ...data.geometry,
      vertices: [...data.geometry.vertices],
      indices: [...data.geometry.indices],
      normals: data.geometry.normals ? [...data.geometry.normals] : undefined,
      uv: data.geometry.uv ? [...data.geometry.uv] : undefined,
    },
    material: data.material ? { ...data.material } : undefined,
  };
}

export function snapshotMeshEditState(
  data: Graphics3DMesh,
  mode: MeshEditMode,
  faceAction: FaceEditAction,
  selection: MeshEditSelection,
): MeshEditHistoryState {
  return {
    data: cloneMesh(data),
    mode,
    faceAction,
    selection: {
      vertices: new Set(selection.vertices),
      edges: new Set(selection.edges),
      faces: new Set(selection.faces),
    },
  };
}

export function cloneMeshEditState(state: MeshEditHistoryState): MeshEditHistoryState {
  return {
    data: cloneMesh(state.data),
    mode: state.mode,
    faceAction: state.faceAction,
    selection: {
      vertices: new Set(state.selection.vertices),
      edges: new Set(state.selection.edges),
      faces: new Set(state.selection.faces),
    },
  };
}

function sameArray(a: number[] | undefined, b: number[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function sameGeometry(a: Graphics3DMesh, b: Graphics3DMesh): boolean {
  const av = a.geometry.vertices;
  const bv = b.geometry.vertices;
  const ai = a.geometry.indices;
  const bi = b.geometry.indices;
  return sameArray(av, bv)
    && sameArray(ai, bi)
    && sameArray(a.geometry.normals, b.geometry.normals)
    && sameArray(a.geometry.uv, b.geometry.uv);
}
