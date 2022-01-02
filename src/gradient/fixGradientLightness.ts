import { GradientNode } from "../types";
import { hsluvToRGB, rgbToHSLUV, rgbToLCH } from "../utilities/color";
import { equals, remap } from "../utilities/number";

export function fixGradientLightnessRelative(gradientNode: GradientNode) {
    const gradient = gradientNode.fills[0]

    const stopsAsLCH = gradient.gradientStops.map(stop => {
        const color = { ...rgbToLCH(stop.color), a: 1 }
        return { ...stop, color }
    })

    let minLuma = +Infinity
    let maxLuma = -Infinity
    let maxChroma = -Infinity
    let maxChromaIndex: number
    stopsAsLCH.forEach((stop, i) => {
        const { l, c } = stop.color
        if (c > maxChroma) {
            maxChromaIndex = i
            maxChroma = c
        }
        if (l < minLuma) minLuma = l
        if (l > maxLuma) maxLuma = l
    })

    const maxChromaLCH = stopsAsLCH[maxChromaIndex].color

    const correctedStops = stopsAsLCH.map((lchStop, i) => {
        const lch = lchStop.color
        let position: number
        if (equals(lch.l, maxChromaLCH.l)) position = 0.5
        else if (lch.l < maxChromaLCH.l) position = remap(lch.l, maxChromaLCH.l, minLuma, 0.5, 0)
        else position = remap(lch.l, maxChromaLCH.l, maxLuma, 0.5, 1)
        const color = { ...gradient.gradientStops[i].color, a: 1 }
        return {
            color,
            position
        }
    })

    const newGradientFill: GradientPaint = {
        ...gradient,
        gradientStops: correctedStops
    }

    gradientNode.fills = [newGradientFill]
}

export function fixGradientLightness(gradientNode: GradientNode) {
    const gradient = gradientNode.fills[0]

    const stopsAsHSLUV = gradient.gradientStops.map(stop => {
        const color = rgbToHSLUV(stop.color)
        return { ...stop, color }
    })

    let minLightness = +Infinity
    let maxLightness = -Infinity
    stopsAsHSLUV.forEach(stop => {
        const { l } = stop.color
        if (l < minLightness) minLightness = l
        if (l > maxLightness) maxLightness = l
    })

    const correctedStops: ColorStop[] = stopsAsHSLUV.map(stop => {
        const color = { ...hsluvToRGB(stop.color), a: 1 }
        const position = remap(stop.color.l, minLightness, maxLightness, 0, 1)
        return {
            color,
            position
        }
    })

    const newGradientFill: GradientPaint = {
        ...gradient,
        gradientStops: correctedStops
    }

    gradientNode.fills = [newGradientFill]
}