import type { Graphics3DWorld, Graphics3DWorldTimeline, Graphics3DTrack, Graphics3DMesh, Graphics3DCamera } from "./types";
import { mapWorldTime } from "./world-time";
import { interpolateKeyframes } from "./timeline";

export interface Evaluated3DWorld {
  worldTime: number;
  meshes: Graphics3DMesh[];
  cameras: Graphics3DCamera[];
}

function tracks(world: Graphics3DWorld): Graphics3DTrack[] { return world.timeline?.tracks ?? []; }

/** Evaluate the intrinsic world animation at a WEGRA time through a view's mapping. */
export function evaluateWorldAtTime(world: Graphics3DWorld, wegraTime: number, mapping: Parameters<typeof mapWorldTime>[1]): Evaluated3DWorld {
  const worldTime = mapWorldTime(wegraTime, mapping);
  let meshes = world.meshes.map(m => ({ ...m, transform: { ...m.transform, position: [...m.transform.position] as [number,number,number], rotation: [...m.transform.rotation] as [number,number,number], scale: [...m.transform.scale] as [number,number,number] } }));
  let cameras = world.cameras.map(c => ({ ...c, position: [...c.position] as [number,number,number], rotation: [...c.rotation] as [number,number,number] }));
  for (const track of tracks(world)) {
    const value = interpolateKeyframes(track.keyframes, worldTime);
    if (value === undefined) continue;
    if (track.targetType === "mesh") meshes = meshes.map(m => m.id !== track.targetId ? m : applyMeshTrack(m, track.property, value));
    if (track.targetType === "camera") cameras = cameras.map(c => c.id !== track.targetId ? c : applyCameraTrack(c, track.property, value));
  }
  return { worldTime, meshes, cameras };
}

function applyMeshTrack(mesh: Graphics3DMesh, property: Graphics3DTrack["property"], value: number): Graphics3DMesh {
  const t = { ...mesh.transform, position: [...mesh.transform.position] as [number,number,number], rotation: [...mesh.transform.rotation] as [number,number,number], scale: [...mesh.transform.scale] as [number,number,number] };
  if (property === "positionX") t.position[0] = value; else if (property === "positionY") t.position[1] = value; else if (property === "positionZ") t.position[2] = value;
  else if (property === "rotationX") t.rotation[0] = value; else if (property === "rotationY") t.rotation[1] = value; else if (property === "rotationZ") t.rotation[2] = value;
  else if (property === "scaleX") t.scale[0] = value; else if (property === "scaleY") t.scale[1] = value; else if (property === "scaleZ") t.scale[2] = value;
  return { ...mesh, transform: t };
}
function applyCameraTrack(camera: Graphics3DCamera, property: Graphics3DTrack["property"], value: number): Graphics3DCamera {
  const c = { ...camera, position: [...camera.position] as [number,number,number], rotation: [...camera.rotation] as [number,number,number] };
  if (property === "positionX") c.position[0] = value; else if (property === "positionY") c.position[1] = value; else if (property === "positionZ") c.position[2] = value;
  else if (property === "rotationX") c.rotation[0] = value; else if (property === "rotationY") c.rotation[1] = value; else if (property === "rotationZ") c.rotation[2] = value;
  else if (property === "fov") c.fov = value;
  return c;
}
