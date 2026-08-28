export interface Scene { id: string; name: string; start: number; duration: number; }
export interface SceneTimeline { scenes: Scene[]; currentSceneId: string; currentTime: number; }
export const DEFAULT_SCENE_DURATION = 5;
export function createScene(name = "Scene", start = 0, duration = DEFAULT_SCENE_DURATION): Scene { return { id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, start, duration: Math.max(0.1, duration) }; }
export function timelineDuration(timeline: SceneTimeline): number { return timeline.scenes.reduce((max, s) => Math.max(max, s.start + s.duration), 0); }
export function normalizeScenes(scenes: Scene[]): Scene[] { let cursor = 0; return scenes.map(s => { const next = { ...s, start: cursor, duration: Math.max(0.1, s.duration) }; cursor += next.duration; return next; }); }
export function addScene(timeline: SceneTimeline, name?: string): SceneTimeline { const start = timelineDuration(timeline); const scene = createScene(name ?? `Scene ${timeline.scenes.length + 1}`, start); return { ...timeline, scenes: [...timeline.scenes, scene], currentSceneId: scene.id, currentTime: start }; }
export function removeScene(timeline: SceneTimeline, id: string): SceneTimeline { if (timeline.scenes.length <= 1) return timeline; const scenes = normalizeScenes(timeline.scenes.filter(s => s.id !== id)); const current = scenes.find(s => s.id === timeline.currentSceneId) ?? scenes[Math.max(0, scenes.length - 1)]; return { ...timeline, scenes, currentSceneId: current.id, currentTime: current.start }; }
export function setSceneDuration(timeline: SceneTimeline, id: string, duration: number): SceneTimeline { return { ...timeline, scenes: normalizeScenes(timeline.scenes.map(s => s.id === id ? { ...s, duration: Math.max(0.1, duration) } : s)) }; }
export function sceneAtTime(timeline: SceneTimeline, time: number): Scene | undefined { return timeline.scenes.find(s => time >= s.start && time < s.start + s.duration) ?? timeline.scenes.at(-1); }
