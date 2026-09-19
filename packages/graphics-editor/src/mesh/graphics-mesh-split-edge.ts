import type { Graphics3DMesh } from "../types";
import { edgeIdForVertices } from "./topology";
import { splitEdge } from "./split-edge";

/** Split one or more selected mesh edges at their midpoint. */
export function splitGraphicsMeshEdges(mesh: Graphics3DMesh, keys: Set<string>): Graphics3DMesh {
  if (!keys.size) return mesh;

  // Edge keys use the stable original vertex ids. Splitting appends vertices,
  // so the remaining selected keys stay valid while we process them.
  let topologyMesh = buildTopology(mesh);
  let next = mesh;

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

function buildTopology(mesh: Graphics3DMesh) {
  const faces: number[][] = [];
  for (let i = 0; i + 2 < mesh.geometry.indices.length; i += 3) {
    faces.push([mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]]);
  }

  // Local import keeps the public graphics-mesh operation independent of
  // the renderer and uses the same authoritative half-edge representation.
  const { fromPolygons } = requireFromPolygons();
  return fromPolygons({ positions: mesh.geometry.vertices, faces });
}

function graphicsMeshFromTopology(source: Graphics3DMesh, topology: ReturnType<typeof import("./from-polygons").fromPolygons>): Graphics3DMesh {
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

function requireFromPolygons() {
  // Kept as a function to avoid exposing topology implementation details at
  // module initialization time.
  return require("./from-polygons") as typeof import("./from-polygons");
}
