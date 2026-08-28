import type { Graphics3DCamera, Graphics3DMesh, Graphics3DWorld } from "../types";

export interface ThreeDWorkspaceInspectorProps {
  world: Graphics3DWorld; selectedId: string | null; cameraId: string; editCamera: boolean;
  onEditCamera: (editing: boolean) => void; onSelect: (id: string | null) => void;
  onUpdateMesh: (id: string, patch: Partial<Omit<Graphics3DMesh, "id">>) => void;
  onUpdateCamera: (id: string, patch: Partial<Omit<Graphics3DCamera, "id">>) => void;
  onAddBox: () => void; onDeleteMesh: () => void; onCameraChange: (id: string) => void; onAddCamera: () => void; onAddLight: () => void;
}

type Axis = "x" | "y" | "z";
const AXES: Axis[] = ["x", "y", "z"];
function VectorFields({label,values,onChange,step=0.1}:{label:string;values:[number,number,number];onChange:(index:number,value:number)=>void;step?:number}) {
 return <fieldset style={{border:0,padding:0,margin:"8px 0"}}><legend style={{fontWeight:600}}>{label}</legend>{AXES.map((axis,i)=><label key={axis} style={{display:"block"}}>{axis.toUpperCase()} <input type="number" step={step} value={values[i]} onChange={e=>onChange(i,Number(e.target.value))}/></label>)}</fieldset>;
}
function updateTransform(mesh:Graphics3DMesh,patch:Partial<Graphics3DMesh["transform"]>):Graphics3DMesh["transform"] { return {...mesh.transform,...patch}; }

export function ThreeDWorkspaceInspector({ world, selectedId, cameraId, editCamera, onEditCamera, onSelect, onUpdateMesh, onUpdateCamera, onAddBox, onDeleteMesh, onCameraChange, onAddCamera, onAddLight }: ThreeDWorkspaceInspectorProps) {
 const selected=world.meshes.find(mesh=>mesh.id===selectedId); const camera=world.cameras.find(item=>item.id===cameraId)??world.cameras[0];
 const changeVector=(kind:"position"|"rotation"|"scale",index:number,value:number)=>{if(!selected)return;const values=[...selected.transform[kind]] as [number,number,number];values[index]=Number.isFinite(value)?value:0;onUpdateMesh(selected.id,{transform:updateTransform(selected,{[kind]:values})});};
 return <aside style={{padding:12,overflow:"auto",borderLeft:"1px solid #30343b",fontSize:13}}>
  <strong>{world.name??"3D World"}</strong>
  <div style={{marginTop:10,display:"flex",gap:6}}><button onClick={onAddBox}>+ Box</button><button onClick={onDeleteMesh} disabled={!selectedId}>Delete</button></div>
  <h4>Objects</h4>{world.meshes.map(mesh=><button key={mesh.id} onClick={()=>{onEditCamera(false);onSelect(mesh.id)}} style={{display:"block",width:"100%",textAlign:"left",marginBottom:4,fontWeight:mesh.id===selectedId?700:400}}>{mesh.name??mesh.id}</button>)}
  {selected&&<>
   <label style={{display:"block",marginTop:8}}>Name <input value={selected.name??""} placeholder={selected.id} onChange={e=>onUpdateMesh(selected.id,{name:e.target.value||undefined})}/></label>
   <VectorFields label="Position" values={selected.transform.position} onChange={(i,v)=>changeVector("position",i,v)}/>
   <VectorFields label="Rotation (radians)" values={selected.transform.rotation} onChange={(i,v)=>changeVector("rotation",i,v)}/>
   <VectorFields label="Scale" values={selected.transform.scale} onChange={(i,v)=>changeVector("scale",i,v)}/>
   <h4>Material</h4>
   <label style={{display:"block"}}>Color <input type="color" value={selected.material?.color??"#78a9ff"} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,color:e.target.value}})}/></label>
   <label style={{display:"block"}}>Roughness <input type="number" min="0" max="1" step="0.05" value={selected.material?.roughness??0.75} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,roughness:Number(e.target.value)}})}/></label>
   <label style={{display:"block"}}>Metalness <input type="number" min="0" max="1" step="0.05" value={selected.material?.metalness??0} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,metalness:Number(e.target.value)}})}/></label>
   <label style={{display:"block"}}><input type="checkbox" checked={!!selected.material?.wireframe} onChange={e=>onUpdateMesh(selected.id,{material:{...selected.material,wireframe:e.target.checked}})}/> Wireframe</label>
  </>}
  <h4>Camera</h4><div><select value={camera?.id??""} onChange={e=>{onCameraChange(e.target.value);onEditCamera(true)}}>{world.cameras.map(item=><option key={item.id} value={item.id}>{item.name??item.id}</option>)}</select> <button onClick={onAddCamera}>+</button></div>
  {camera&&<><button style={{marginTop:6}} onClick={()=>onEditCamera(!editCamera)}>{editCamera?"Stop editing camera":"Edit camera in viewport"}</button><select value={camera.projection} onChange={e=>onUpdateCamera(camera.id,{projection:e.target.value as Graphics3DCamera["projection"]})}><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select><VectorFields label="Camera position" values={camera.position} onChange={(i,v)=>{const p=[...camera.position] as [number,number,number];p[i]=v;onUpdateCamera(camera.id,{position:p})}}/>{camera.projection==="perspective"&&<label style={{display:"block"}}>FOV <input type="number" min="1" max="179" step="1" value={camera.fov??50} onChange={e=>onUpdateCamera(camera.id,{fov:Number(e.target.value)})}/></label>}</>}
  <h4>Lights</h4><div>{(world.lights??[]).length} lights <button onClick={onAddLight}>+ Light</button></div>
 </aside>;
}
