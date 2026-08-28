import { useEffect, useState } from "react";
import type { Graphics3DMesh } from "../types";

export interface ThreeDMeshGeometryEditorProps { mesh: Graphics3DMesh; onChange: (patch: Pick<Graphics3DMesh, "geometry">) => void; }

function parseNumbers(value: string): number[] | null {
  const parts = value.split(/[\s,;]+/).filter(Boolean);
  const numbers = parts.map(Number);
  return numbers.length && numbers.every(Number.isFinite) ? numbers : null;
}

export function ThreeDMeshGeometryEditor({ mesh, onChange }: ThreeDMeshGeometryEditorProps) {
  const [vertices, setVertices] = useState(mesh.geometry.vertices.join(" "));
  const [indices, setIndices] = useState(mesh.geometry.indices.join(" "));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setVertices(mesh.geometry.vertices.join(" ")); setIndices(mesh.geometry.indices.join(" ")); }, [mesh.id, mesh.geometry.vertices, mesh.geometry.indices]);
  const apply = () => {
    const v = parseNumbers(vertices), i = parseNumbers(indices);
    if (!v || v.length % 3 !== 0) { setError("Vertices must be numbers in X Y Z groups."); return; }
    if (!i || i.length % 3 !== 0 || i.some(n => !Number.isInteger(n) || n < 0 || n >= v.length / 3)) { setError("Indices must be triangle indices referring to existing vertices."); return; }
    setError(null); onChange({ geometry: { ...mesh.geometry, vertices: v, indices: i, normals: undefined } });
  };
  return <div style={{marginTop:10}}>
    <h4>Geometry</h4>
    <label style={{display:"block"}}>Vertices (x y z)<textarea rows={5} value={vertices} onChange={e=>setVertices(e.target.value)} style={{width:"100%",boxSizing:"border-box",fontFamily:"monospace"}} /></label>
    <label style={{display:"block",marginTop:6}}>Triangles (indices)<textarea rows={3} value={indices} onChange={e=>setIndices(e.target.value)} style={{width:"100%",boxSizing:"border-box",fontFamily:"monospace"}} /></label>
    <button style={{marginTop:6}} onClick={apply}>Apply geometry</button>
    <button style={{marginLeft:6}} onClick={()=>{setVertices(mesh.geometry.vertices.join(" "));setIndices(mesh.geometry.indices.join(" "));setError(null)}}>Reset</button>
    {error&&<div role="alert" style={{marginTop:6}}>{error}</div>}
    <div style={{opacity:.7,marginTop:6}}>{mesh.geometry.vertices.length/3} vertices · {mesh.geometry.indices.length/3} triangles</div>
  </div>;
}
