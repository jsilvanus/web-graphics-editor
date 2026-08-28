import type { Graphics3DMesh } from "../types";
import { bevelSelectedEdges } from "./bevel/bevel-edge";

/** Public bevel entry point. Topology and geometry live in focused modules. */
export function bevelMeshEdges(mesh: Graphics3DMesh, edgeKeys: Set<string>, amount: number): Graphics3DMesh {
  return bevelSelectedEdges(mesh, edgeKeys, amount);
}
