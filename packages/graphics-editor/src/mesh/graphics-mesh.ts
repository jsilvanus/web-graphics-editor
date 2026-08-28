import type { Graphics3DMesh } from "../types";
import type { HalfEdgeMesh } from "./half-edge";
import { fromPolygons, polygonsFromHalfEdges } from "./from-polygons";
import { halfEdgeToTriangleGeometry } from "./geometry";
import { assertValidHalfEdgeMesh } from "./validate";

/** Build the editable topology representation directly from a Graphics3DMesh. */
export function graphicsMeshToHalfEdge(mesh: Graphics3DMesh): HalfEdgeMesh {
  if (mesh.geometry.vertices.length % 3 !== 0) {
    throw new Error(`Mesh ${mesh.id} has an invalid vertex buffer length`);
  }
  if (mesh.geometry.indices.length % 3 !== 0) {
    throw new Error(`Mesh ${mesh.id} has a non-triangular index buffer`);
  }

  const vertexCount = mesh.geometry.vertices.length / 3;
  for (const index of mesh.geometry.indices) {
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      throw new Error(`Mesh ${mesh.id} contains an invalid vertex index ${index}`);
    }
  }

  const faces: number[][] = [];
  for (let i = 0; i < mesh.geometry.indices.length; i += 3) {
    faces.push([mesh.geometry.indices[i], mesh.geometry.indices[i + 1], mesh.geometry.indices[i + 2]]);
  }

  const topology = fromPolygons({ positions: mesh.geometry.vertices, faces });
  assertValidHalfEdgeMesh(topology);
  return topology;
}

/** Convert topology back into the document's renderable Graphics3DMesh representation. */
export function halfEdgeToGraphicsMesh(mesh: Graphics3DMesh, topology: HalfEdgeMesh): Graphics3DMesh {
  assertValidHalfEdgeMesh(topology);
  const geometry = halfEdgeToTriangleGeometry(topology);
  return {
    ...mesh,
    geometry: {
      ...mesh.geometry,
      vertices: geometry.vertices,
      indices: geometry.indices,
      // Topology-changing operations invalidate derived vertex attributes.
      // The renderer will regenerate normals when they are absent.
      normals: undefined,
      uv: undefined,
    },
  };
}

/** Run a topology transformation while preserving the Graphics3DMesh envelope. */
export function updateGraphicsMeshTopology(
  mesh: Graphics3DMesh,
  transform: (topology: HalfEdgeMesh) => HalfEdgeMesh,
): Graphics3DMesh {
  return halfEdgeToGraphicsMesh(mesh, transform(graphicsMeshToHalfEdge(mesh)));
}

/** Return the polygonal faces represented by a Graphics3DMesh. */
export function graphicsMeshFaces(mesh: Graphics3DMesh): number[][] {
  return polygonsFromHalfEdges(graphicsMeshToHalfEdge(mesh));
}
