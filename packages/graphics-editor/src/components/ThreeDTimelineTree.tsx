import type { FC } from "react";
import type { Graphics3DAnimatedProperty, Graphics3DAnimationTarget, Graphics3DWorld, Layer } from "../types";

export interface ThreeDTimelineTreeProps {
  views: Layer[];
  worlds: Graphics3DWorld[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  renderTrack: (targetType: Graphics3DAnimationTarget, targetId: string, property: Graphics3DAnimatedProperty) => React.ReactNode;
}

const TRANSFORM_PROPERTIES: Graphics3DAnimatedProperty[] = [
  "positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ",
  "scaleX", "scaleY", "scaleZ",
];
const CAMERA_PROPERTIES: Graphics3DAnimatedProperty[] = [
  "positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "fov",
];

/**
 * Renders the semantic 3D timeline hierarchy from world contents, not animation tracks.
 * This deliberately makes unanimated meshes/cameras visible so users can add their
 * first keyframe directly from the timeline.
 */
export const ThreeDTimelineTree: FC<ThreeDTimelineTreeProps> = ({ views, worlds, expanded, toggle, renderTrack }) => (
  <>
    {views.map(viewLayer => {
      const viewId = viewLayer.view3dId ?? viewLayer.id;
      const view = worlds.flatMap(world => []).length === -1 ? undefined : undefined;
      const worldId = (viewLayer as Layer & { world3dId?: string }).world3dId;
      const world = worlds.find(w => w.id === worldId);
      return (
        <div className="ge-3d-tree" key={viewLayer.id}>
          <button className="ge-tree-row ge-tree-view" onClick={() => toggle(`view:${viewId}`)}>
            {expanded.has(`view:${viewId}`) ? "▾" : "▸"} ◈ {viewLayer.text || "3D View"}
          </button>
          {expanded.has(`view:${viewId}`) && (
            <div className="ge-3d-children">
              <div className="ge-tree-label">View</div>
              {(["opacity", "visibility"] as Graphics3DAnimatedProperty[]).map(p => renderTrack("view", viewId, p))}
              <div className="ge-tree-label">Objects</div>
              {world?.meshes.length ? world.meshes.map(mesh => (
                <div className="ge-3d-object" key={mesh.id}>
                  <b>◆ {mesh.name || mesh.id}</b>
                  {TRANSFORM_PROPERTIES.map(p => renderTrack("mesh", mesh.id, p))}
                </div>
              )) : <div className="ge-tree-empty">No 3D objects</div>}
              <div className="ge-tree-label">Cameras</div>
              {world?.cameras.length ? world.cameras.map(camera => (
                <div className="ge-3d-object" key={camera.id}>
                  <b>◉ {camera.name || camera.id}</b>
                  {CAMERA_PROPERTIES.map(p => renderTrack("camera", camera.id, p))}
                </div>
              )) : <div className="ge-tree-empty">No 3D cameras</div>}
            </div>
          )}
        </div>
      );
    })}
  </>
);
