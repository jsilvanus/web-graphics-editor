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

const TRANSFORM_PROPERTIES: Graphics3DAnimatedProperty[] = ["positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "scaleX", "scaleY", "scaleZ"];
const CAMERA_PROPERTIES: Graphics3DAnimatedProperty[] = ["positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "fov"];

/** 3D timeline hierarchy is derived from world contents, so unanimated entities are visible. */
export const ThreeDTimelineTree: FC<ThreeDTimelineTreeProps> = ({ views, viewData, worlds, expanded, toggle, renderTrack }) => (
  <>
    {views.map(viewLayer => {
      const viewId = viewLayer.view3dId ?? viewLayer.id;
      const view = viewData.find(candidate => candidate.id === viewId);
      const world = view ? worlds.find(candidate => candidate.id === view.worldId) : undefined;
      const viewKey = `view:${viewId}`;
      return <div className="ge-3d-tree" key={viewLayer.id}>
        <button className="ge-tree-row ge-tree-view" onClick={() => toggle(viewKey)}>{expanded.has(viewKey) ? "▾" : "▸"} ◈ {viewLayer.text || view?.name || "3D View"}</button>
        {expanded.has(viewKey) && <div className="ge-3d-children">
          <div className="ge-tree-label">View</div>
          {(["opacity", "visibility"] as Graphics3DAnimatedProperty[]).map(property => renderTrack("view", viewId, property))}
          <div className="ge-tree-label">Objects</div>
          {world?.meshes.length ? world.meshes.map(mesh => <div className="ge-3d-object" key={mesh.id}>
            <b>◆ {mesh.name || mesh.id}</b>
            {TRANSFORM_PROPERTIES.map(property => renderTrack("mesh", mesh.id, property))}
          </div>) : <div className="ge-tree-empty">No 3D objects</div>}
          <div className="ge-tree-label">Cameras</div>
          {world?.cameras.length ? world.cameras.map(camera => <div className="ge-3d-object" key={camera.id}>
            <b>◉ {camera.name || camera.id}</b>
            {CAMERA_PROPERTIES.map(property => renderTrack("camera", camera.id, property))}
          </div>) : <div className="ge-tree-empty">No 3D cameras</div>}
        </div>}
      </div>;
    })}
  </>
);
