import type { Composition } from "./types";

export function compositionPathNames(compositions: Composition[], path: string[]): string[] {
  return path.map(id => compositions.find(composition => composition.id === id)?.name ?? id);
}

export function enterCompositionPath(path: string[], compositionId: string): string[] {
  const index = path.indexOf(compositionId);
  return index >= 0 ? path.slice(0, index + 1) : [...path, compositionId];
}

export function exitCompositionPath(path: string[]): string[] {
  return path.slice(0, -1);
}
