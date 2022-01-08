
import { GradientNode, Scale, DEFAULT_STOPS, ScaleType } from "../types";

export function interpretGradientNode(gradientNode: GradientNode, stops = DEFAULT_STOPS, type = ScaleType.LightnessAbsolute): Scale {
    const name = gradientNode.name.trim()
    const gradient = gradientNode.fills[0]
    const options = { type, stops, baseColor: { r: 0, g: 0, b: 0 } }
    return { name, gradient, options }
}