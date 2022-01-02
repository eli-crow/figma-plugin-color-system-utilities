import { GradientNode } from "../types";

export function filterToGradientNodes(nodes: readonly SceneNode[]) {
    return nodes.filter(node => (node as MinimalFillsMixin).fills?.[0]?.type === 'GRADIENT_LINEAR') as unknown as GradientNode[]
}