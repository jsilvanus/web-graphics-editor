import type { Graphics3DCamera, Graphics3DLight, Graphics3DMesh, Graphics3DWorld } from "../types";
import { ThreeDMeshGeometryEditor } from "./ThreeDMeshGeometryEditor";

export interface ThreeDWorkspaceInspectorProps { world: Graphics3DWorld; selectedId: string | null; selectedLightId: string | null; cameraId: string; editCamera: boolean; onEditCamera: (editing: boolean) => void; onSelect: (id: string | null) => void; onSelectLight: (id: string) => void; onUpdateMesh: (id: string, patch: Partial<Omit<Graphics3DMesh, "id">>) => void; onUpdateCamera: (id: string, patch: Partial<Omit<Graphics3DCamera, "id">>) => void; onUpdateLight: (id: string, patch: Partial<Omit<Graphics3DLight, "id">>) => void; onAddBox: () => void; onDeleteMesh: () => void; onCameraChange: (id: string) => void; onAddCamera: () => void; onAddLight: () => void; }
type Axis = "x" | "y" | "z"; const AXES: Axis[] = ["x", "y", "z"];
function VectorFields({label,values,onChange,step=0.1}:{label:string;values:[number,number,number];onChange:(index:number,value:number)=>void;step?:number}) { return <fieldset style={{border:0,padding:0,margin:"8px 0"}}><legend style={{fontWeight:600}}>{label}</legend>{AXES.map((axis,i)=><label key={axis} style={{display:"block",marginBottom:3}}>{axis.toUpperCase()} <input type="number" step={step} value={values[i]} onChange={e=>onChange(i,Number(e.target.value))}/></label>)}</fieldset>; }
function updateTransform(mesh:Graphics3DMesh,patch:Partial<Graphics3DMesh["transform"]>):Graphics3DMesh["transform"] { return {...mesh.transform,...patch}; }

export function ThreeDWorkspaceInspector({ world, selectedId, selectedLightId, cameraId, editCamera, onEditCamera, onSelect, onSelectLight, onUpdateMesh, onUpdateCamera, onUpdateLight, onAddBox, onDeleteMesh, onCameraChange, onAddCamera, onAddLight }: ThreeDWorkspaceInspectorProps) {
 const selected=world.meshes.find(mesh=>mesh.id===selectedId); const light=world.lights?.find(item=>item.id===selectedLightId); const camera=world.cameras.find(item=>item.id===cameraId)??world.cameras[0];
 const changeVector=(kind:"position"|"rotation"|"scale",index:number,value:number)=>{if(!selected)return;const values=[...selected.transform[kind]] as [number,number,number];values[index]=Number.isFinite(value)?value:0;onUpdateMesh(selected.id,{transform:updateTransform(selected,{[kind]:values})});};
 return <aside style={{padding:12,overflow:"auto",borderLeft:"1px solid #30343b",fontSize:13}}>
  <strong>{world.name??"3D World"}</strong>
  <div style={{marginTop:6,opacity:.65,fontSize:11}}>{world.meshes.length} meshes · {(world.lights??[]).length} lights · {world.cameras.length} cameras</div>
  <div style={{marginTop:10,display:"flex",gap:6}}><button onClick={onAddBox}>+ Box</button><button onClick={onAddLight}>+ Light</button><button onClick={onDeleteMesh} disabled={!selected}>Delete</button></div>

  <details open><summary style={{cursor:"pointer",fontWeight:600,margin:"12px 0 6px"}}>Scene</summary>
    <div style={{fontSize:11,opacity:.65,marginBottom:5}}>Meshes</div>
    {world.meshes.map(mesh=><button key={mesh.id} onClick={()=>{onEditCamera(false);onSelect(mesh.id)}} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,fontWeight:mesh.id===selectedId?700:400}}>{mesh.name??mesh.id}</button>)}
    <div style={{fontSize:11,opacity:.65,margin:"8px 0 5px"}}>Lights</div>
    {(world.lights??[]).map(item=><button key={item.id} onClick={()=>onSelectLight(item.id)} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,fontWeight:item.id===selectedLightId?700:400}}>{item.type} · {item.id}</button>)}
  </details>

  {selected&&<details open><summary style={{cursor:"pointer",fontWeight:600,margin:"12px 0 6px"}}>Selected mesh</summary>
   <label style={{display:"block",marginTop:8}}>Name <input value={selected.name??""} placeholder={selected.id} onChange={e=>onUpdateMesh(selected.id,{name:e.target.value||undefined})}/></label>
   <label style={{display:"block",marginTop:6}}><input type="checkbox" checked={selected.visible!==false} onChange={e=>onUpdateMesh(selected.id,{visible:e.target.checked})}/> Visible</label>
   <VectorFields label="Position" values={selected.transform.position} onChange={(i,v)=>changeVector("position",i,v)}/>
   <VectorFields label="Rotation (radians)" values={selected.transform.rotation} onChange={(i,v)=>changeVector("rotation",i,v)}/>
   <VectorFields label="Scale" values={selected.transform.scale} onChange={(i,v)=>changeVector("scale",i,v)}/>
   <h4>Material</h4>
   <label style={{display:"block"}}>Color <input type="color" value={selected.material?.color??"#78a9ff"} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,color:e.target.value}})}/></label>
   <label style={{display:"block"}}>Opacity <input type="number" min="0" max="1" step="0.05" value={selected.material?.opacity??selected.opacity??1} onChange={e=>onUpdateMesh(selected.id,{opacity:Number(e.target.value),material:{...selected.material,opacity:Number(e.target.value)}})}/></label>
   <label style={{display:"block"}}>Roughness <input type="number" min="0" max="1" step="0.05" value={selected.material?.roughness??0.75} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,roughness:Number(e.target.value)}})}/></label>
   <label style={{display:"block"}}>Metalness <input type="number" min="0" max="1" step="0.05" value={selected.material?.metalness??0} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,metalness:Number(e.target.value)}})}/></label>
   <label style={{display:"block"}}><input type="checkbox" checked={!!selected.material?.wireframe} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,wireframe:e.target.checked}})}/> Wireframe</label>
   <ThreeDMeshGeometryEditor mesh={selected} onChange={patch=>onUpdateMesh(selected.id,patch)} />
  </details>}

  {light&&<details open><summary style={{cursor:"pointer",fontWeight:600,margin:"12px 0 6px"}}>Selected light</summary>
    <label style={{display:"block"}}>Type <select value={light.type} onChange={e=>onUpdateLight(light.id,{type:e.target.value as Graphics3DLight["type"]})}><option value="ambient">Ambient</option><option value="directional">Directional</option><option value="point">Point</option><option value="spot">Spot</option></select></label>
    <label style={{display:"block",marginTop:6}}>Color <input type="color" value={light.color??"#ffffff"} onChange={e=>onUpdateLight(light.id,{color:e.target.value})}/></label>
    <label style={{display:"block",marginTop:6}}>Intensity <input type="number" min="0" step="0.1" value={light.intensity??1} onChange={e=>onUpdateLight(light.id,{intensity:Number(e.target.value)})}/></label>
    {light.position&&<VectorFields label="Position" values={light.position} onChange={(i,v)=>{const p=[...light.position!] as [number,number,number];p[i]=Number.isFinite(v)?v:0;onUpdateLight(light.id,{position:p})}}/>}
    {(light.type==="point"||light.type==="spot")&&<label style={{display:"block"}}>Distance <input type="number" min="0" step="0.5" value={light.distance??0} onChange={e=>onUpdateLight(light.id,{distance:Number(e.target.value)})}/></label>}
    {light.type==="spot"&&<><label style={{display:"block"}}>Angle <input type="number" min="0.01" max="3.14" step="0.05" value={light.angle??0.5} onChange={e=>onUpdateLight(light.id,{angle:Number(e.target.value)})}/></label><label style={{display:"block"}}>Penumbra <input type="number" min="0" max="1" step="0.05" value={light.penumbra??0} onChange={e=>onUpdateLight(light.id,{penumbra:Number(e.target.value)})}/></label></>}
  </details>}

  <details open><summary style={{cursor:"pointer",fontWeight:600,margin:"12px 0 6px"}}>Camera</summary><div><select value={camera?.id??""} onChange={e=>onCameraChange(e.target.value)}>{world.cameras.map(item=><option key={item.id} value={item.id}>{item.name??item.id}</option>)}</select> <button onClick={onAddCamera}>+</button></div>
  {camera&&<><button style={{marginTop:6}} onClick={()=>onEditCamera(!editCamera)}>{editCamera?"Stop editing camera":"Edit camera in viewport"}</button><label style={{display:"block",marginTop:6}}>Projection <select value={camera.projection} onChange={e=>onUpdateCamera(camera.id,{projection:e.target.value as Graphics3DCamera["projection"]})}><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select></label><VectorFields label="Camera position" values={camera.position} onChange={(i,v)=>{const p=[...camera.position] as [number,number,number];p[i]=v;onUpdateCamera(camera.id,{position:p})}}/>{camera.projection==="perspective"&&<label style={{display:"block"}}>FOV <input type="number" min="1" max="179" step="1" value={camera.fov??50} onChange={e=>onUpdateCamera(camera.id,{fov:Number(e.target.value)})}/></label>}</>}
  </details>
 </aside>;
}
