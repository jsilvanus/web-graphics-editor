import type { GraphicsDocument, Layer } from "./types";

export interface RenderNode {
  layer: Layer;
  children: RenderNode[];
  opacity: number;
}

/**
 * Resolves the editor document into a renderer-friendly tree.
 * The editor remains free to keep hierarchy in Layer.parentId/children;
 * renderers consume only this normalized representation.
 */
export function buildRenderTree(document: GraphicsDocument): RenderNode[] {
  const byId = new Map(document.layers.map(layer => [layer.id, layer]));
  const visiting = new Set<string>();

  const visit = (layer: Layer, inheritedOpacity = 1): RenderNode | null => {
    if (visiting.has(layer.id) || layer.visible === false) return null;
    visiting.add(layer.id);
    const ownOpacity = typeof layer.opacity === "number" ? Math.max(0, Math.min(1, layer.opacity)) : 1;
    const opacity = inheritedOpacity * ownOpacity;
    const children = layer.type === "group"
      ? (layer.children ?? []).map(id => byId.get(id)).filter((child): child is Layer => !!child).map(child => visit(child, opacity)).filter((child): child is RenderNode => !!child)
      : [];
    visiting.delete(layer.id);
    return { layer, children, opacity };
  };

  return document.layers
    .filter(layer => !layer.parentId)
    .map(layer => visit(layer))
    .filter((node): node is RenderNode => !!node);
}

export function flattenRenderTree(nodes: RenderNode[]): RenderNode[] {
  return nodes.flatMap(node => [node, ...flattenRenderTree(node.children)]);
}
