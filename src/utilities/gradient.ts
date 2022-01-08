import { GradientNode } from "../types";
import { remap } from "./number";

export function filterToGradientNodes(nodes: readonly SceneNode[]) {
    return nodes.filter(node => (node as MinimalFillsMixin).fills?.[0]?.type === 'GRADIENT_LINEAR') as unknown as GradientNode[]
}

export function sampleGradient(gradient: GradientPaint, t: number): RGB {
    const stops = [...gradient.gradientStops].sort((a, b) => a.position - b.position)
    const indexAfter = stops.findIndex(s => s.position > t)
    const indexBefore = indexAfter - 1
    const stopAfter = stops[indexAfter]
    const stopBefore = stops[indexBefore]
    const color: RGB = {
        r: remap(t, stopBefore.position, stopAfter.position, stopBefore.color.r, stopAfter.color.r),
        g: remap(t, stopBefore.position, stopAfter.position, stopBefore.color.g, stopAfter.color.g),
        b: remap(t, stopBefore.position, stopAfter.position, stopBefore.color.b, stopAfter.color.b),
    }

    return color
}