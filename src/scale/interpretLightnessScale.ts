import { cssColorToRGB, hsluvToRGB, rgbToHSLUV } from "../utilities/color";
import { Scale, ScaleNode } from "../types";
import { getScaleStopNodes, parseScaleNodeName } from "../utilities/scale";
import { nextPowerOf10, remap } from "../utilities/number";

export interface LightnessScaleOptions {
    name: Scale['name'];
    theme: Scale['theme'];
    min: number;
    max: number;
    referenceLightest: RGB;
    referenceBase: RGB;
    referenceDarkest: RGB;
    stopOffsets: number[];
}
function interpretOptions(scaleNode: ScaleNode): LightnessScaleOptions {
    const { name, theme } = parseScaleNodeName(scaleNode.name)

    // TODO: figure out how to specify these colors.
    const referenceBase = cssColorToRGB('#6463EA')
    const referenceDarkest = cssColorToRGB('#07071E')
    const referenceLightest = cssColorToRGB('#FBFCFF')

    const stopNodes = getScaleStopNodes(scaleNode)
    const stopNumbers = stopNodes.map(node => parseInt(node.name))
    const stopNumbersMax = Math.max(...stopNumbers)
    const min = 0
    const max = nextPowerOf10(stopNumbersMax)
    const stopOffsets = stopNumbers.map(n => n / max)

    return {
        name,
        theme,
        min,
        max,
        stopOffsets,
        referenceBase,
        referenceDarkest,
        referenceLightest,
    }
}

function nearestHue(from: number, to: number) {
    const isReverse = Math.abs(from - to) < Math.abs(to - from)
    return isReverse
        ? to + 360
        : to
}

function getColor(base: RGB, lightest: RGB, darkest: RGB, l: number) {
    const rb = rgbToHSLUV(base)
    const rl = rgbToHSLUV(lightest)
    const rd = rgbToHSLUV(darkest)
    const h = l > rb.l
        ? remap(l, rb.l, rl.l, rb.h, nearestHue(rb.h, rl.h))
        : remap(l, rb.l, rd.l, rb.h, nearestHue(rb.h, rd.h))
    const s = l > rb.l
        ? remap(l, rb.l, rl.l, rb.s, rl.s)
        : remap(l, rb.l, rd.l, rb.s, rd.s)
    return hsluvToRGB({ h, s, l })
}

function generateScale(options: LightnessScaleOptions): Scale {
    return {
        type: 'lightness',
        name: options.name,
        theme: options.theme,
        stops: options.stopOffsets.map(lightness => {
            const color = getColor(
                options.referenceBase,
                options.referenceLightest,
                options.referenceDarkest,
                lightness
            )
            const name = (lightness * options.max).toString()
            const offset = lightness
            return {
                color,
                name,
                offset,
            }
        })
    }
}

export function interpretLighnessScaleNode(scaleNode: ScaleNode): Scale {
    const options = interpretOptions(scaleNode)
    const scale = generateScale(options)
    return scale
}