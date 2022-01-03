import { hsluvToRGB, rgbToHSLUV } from "../utilities/color";
import { remap } from "../utilities/number";
import { GradientNode, Scale } from "../types";
import { parseGradientNodeName, sampleGradient } from "../utilities/gradient";

export interface GradientScaleOptions {
    name: Scale['name'];
    theme: Scale['theme'];
    min: number;
    max: number;
    stopOffsets: number[];
    gradient: GradientPaint;
}

function interpretOptions(gradientNode: GradientNode): GradientScaleOptions {
    const parsed = parseGradientNodeName(gradientNode.name)
    if (parsed === null) {
        throw new Error("Name needs a special format")
    }
    const { name, theme, min, max, stopOffsets } = parsed
    const gradient = gradientNode.fills[0]
    return { name, theme, min, max, stopOffsets, gradient }
}

function nearestHue(from: number, to: number) {
    const isReverse = Math.abs(from - to) < Math.abs(to - from)
    return isReverse
        ? to + 360
        : to
}

function createScale(options: GradientScaleOptions): Scale {
    return {
        type: 'lightness',
        name: options.name,
        theme: options.theme,
        stops: options.stopOffsets.map(offset => {
            const color = sampleGradient(options.gradient, offset)
            const name = (offset * options.max).toString()
            return { name, color, offset }
        }),
        referenceGradient: options.gradient
    }
}

export function interpretGradientNode(gradientNode: GradientNode): Scale {
    const options = interpretOptions(gradientNode)
    const scale = createScale(options)
    return scale
}