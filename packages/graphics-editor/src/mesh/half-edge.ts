export interface HalfEdgeVertex { id: number; halfEdge: number | null }
export interface HalfEdgeEdge { id: number; halfEdge: number }
export interface HalfEdgeFace { id: number; halfEdge: number; boundary: boolean }
export interface HalfEdge { id: number; vertex: number; twin: number | null; next: number; face: number }
export interface HalfEdgeMesh {
  vertices: HalfEdgeVertex[];
  edges: HalfEdgeEdge[];
  faces: HalfEdgeFace[];
  halfEdges: HalfEdge[];
  positions: number[];
}

export interface PolygonMeshInput { positions: number[]; faces: number[][] }
