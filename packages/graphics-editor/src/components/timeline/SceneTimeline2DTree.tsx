import type { FC } from "react";
import type { AnimatedProperty, Layer, Scene } from "../../types";

export interface SceneTimeline2DTreeProps {
  scenes: Scene[];
  layers: Layer[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelectScene: (sceneId: string) => void;
  renderLayer: (layer: Layer, scene: Scene) => React.ReactNode;
  sceneAction?: (scene: Scene, index: number) => React.ReactNode;
}

export const SceneTimeline2DTree: FC<SceneTimeline2DTreeProps> = ({ scenes, layers, expanded, onToggle, onSelectScene, renderLayer, sceneAction }) => (
  <>
    {scenes.map((scene, index) => (
      <div className="ge-scene-tree" key={scene.id}>
        <button className="ge-tree-row ge-tree-scene" onClick={() => { onSelectScene(scene.id); onToggle(`scene:${scene.id}`); }}>
          {expanded.has(`scene:${scene.id}`) ? "▾" : "▸"} {scene.name}
        </button>
        {sceneAction?.(scene, index)}
        {expanded.has(`scene:${scene.id}`) && layers.filter(layer => layer.type !== "group" && layer.type !== "3d-view").map(layer => renderLayer(layer, scene))}
      </div>
    ))}
  </>
);

export const DEFAULT_2D_PROPERTIES: AnimatedProperty[] = ["x", "y", "width", "height", "rotation", "opacity"];
