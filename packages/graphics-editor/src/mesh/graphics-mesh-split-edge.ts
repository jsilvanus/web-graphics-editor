import type { Graphics3DMesh } from "../types";
import { edgeIdForVertices } from "./topology";
import { splitEdge } from "./split-edge";
import { fromPolygons } from "./from-polygons";
import type { HalfEdgeMesh } from "./half-edge";

/** Split one or more selected mesh edges at their midpoint. */
export function splitGraphicsMeshEdges(mesh: Graphics3DMesh, keys: Set<string>): Graphics3DMesh {
  if (!keys.size) return mesh;

  let topologyMesh = buildTopology(mesh);
  let next = mesh;

  // Edge keys use stable original vertex ids. Splitting appends vertices,
  // so remaining selected keys stay valid while we process them.
  for (const key of keys) {
    const [aText, bText] = key.split(":");
    const a = Number(aText);
    const b = Number(bText);
    if (!Number.isInteger(a) || !Number.isInteger(b)) continue;

    const edgeId = edgeIdForVertices(topologyMesh, a, b);
    if (edgeId === null) continue;

    topologyMesh = splitEdge(topologyMesh, edgeId);
    next = graphicsMeshFromTopology(next, topologyMesh);
  }

  return next;
}

function buildTopology(mesh: Graphics3DMesh): HalfEdgeMesh {
  const faces: number[][] = [];
  for (let i = 0; i + 2 < mesh.geometry.indices.length; i += 3) {
    faces.push([mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]]);
  }
  return fromPolygons({ positions: mesh.geometry.vertices, faces });
}

function graphicsMeshFromTopology(source: Graphics3DMesh, topology: HalfEdgeMesh): Graphics3DMesh {
  const indices: number[] = [];
  for (const face of topology.faces) {
    if (face.length !== 3) throw new Error("Edge split produced a non-triangle face");
    indices.push(face[0], face[1], face[2]);
  }

  return {
    ...source,
    geometry: {
      ...source.geometry,
      vertices: [...topology.positions],
      indices,
      normals: undefined,
    },
  };
}
