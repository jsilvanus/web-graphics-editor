import type { FC } from "react";
import type { Scene, SceneTransitionType } from "../../types";

const TRANSITIONS: SceneTransitionType[] = ["cut", "fade", "dissolve", "slide-left", "slide-right", "slide-up", "slide-down"];

export interface SceneTransitionControlsProps {
  scenes: Scene[];
  onChange: (sceneId: string, type: SceneTransitionType, duration: number) => void;
}

export const SceneTransitionControls: FC<SceneTransitionControlsProps> = ({ scenes, onChange }) => (
  <div className="ge-scene-controls">
    <b>Scene transitions</b>
    {scenes.map((scene, i) => i < scenes.length - 1 && (
      <div className="ge-scene-control" key={scene.id}>
        <span>{scene.name} →</span>
        <select value={scene.transition?.type ?? "cut"} onChange={e => onChange(scene.id, e.target.value as SceneTransitionType, scene.transition?.duration ?? 0.5)}>
          {TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="number" min="0" max={scene.duration} step=".1" value={scene.transition?.duration ?? 0} onChange={e => onChange(scene.id, scene.transition?.type ?? "cut", Number(e.target.value) || 0)} />
        <span>s</span>
      </div>
    ))}
  </div>
);
