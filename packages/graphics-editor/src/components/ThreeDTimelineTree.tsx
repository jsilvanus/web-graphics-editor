import type { FC, ReactNode } from "react";
import type { Graphics3DAnimatedProperty, Graphics3DAnimationTarget, Graphics3DView, Graphics3DWorld, Layer } from "../types";

export interface ThreeDTimelineTreeProps {
  views: Layer[];
  viewData: Graphics3DView[];
  worlds: Graphics3DWorld[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  renderTrack: (targetType: Graphics3DAnimationTarget, targetId: string, property: Graphics3DAnimatedProperty) => ReactNode;
}

const MESH_PROPERTIES: Graphics3DAnimatedProperty[] = ["positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "scaleX", "scaleY", "scaleZ"];
const CAMERA_PROPERTIES: Graphics3DAnimatedProperty[] = ["positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "fov"];

/** The 3D timeline tree is world-driven: unanimated entities are visible immediately. */
export const ThreeDTimelineTree: FC<ThreeDTimelineTreeProps> = ({ views, viewData, worlds, expanded, toggle, renderTrack }) => (
  <>
    {views.map(layer => {
      const viewId = layer.view3dId ?? layer.id;
      const view = viewData.find(candidate => candidate.id === viewId);
      const world = view ? worlds.find(candidate => candidate.id === view.worldId) : undefined;
      const key = `view:${viewId}`;
      return (
        <div className="ge-3d-tree" key={layer.id}>
          <button className="ge-tree-row ge-tree-view" onClick={() => toggle(key)}>
            {expanded.has(key) ? "▾" : "▸"} ◈ {layer.text || view?.name || "3D View"}
          </button>
          {expanded.has(key) && <div className="ge-3d-children">
            <div className="ge-tree-label">View</div>
            {(["opacity", "visibility"] as Graphics3DAnimatedProperty[]).map(p => renderTrack("view", viewId, p))}
            <div className="ge-tree-label">Objects</div>
            {world?.meshes.length ? world.meshes.map(mesh => <div className="ge-3d-object" key={mesh.id}>
              <b>◆ {mesh.name || mesh.id}</b>
              {MESH_PROPERTIES.map(p => renderTrack("mesh", mesh.id, p))}
            </div>) : <div className="ge-tree-empty">No 3D objects</div>}
            <div className="ge-tree-label">Cameras</div>
            {world?.cameras.length ? world.cameras.map(camera => <div className="ge-3d-object" key={camera.id}>
              <b>◉ {camera.name || camera.id}</b>
              {CAMERA_PROPERTIES.map(p => renderTrack("camera", camera.id, p))}
            </div>) : <div className="ge-tree-empty">No 3D cameras</div>}
          </div>}
        </div>
      );
    })}
  </>
);
