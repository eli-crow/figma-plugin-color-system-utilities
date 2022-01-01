import { cssColorToRGB } from "../color/colorUtilities";
import { LightnessScaleOptions, Scale, ScaleNode } from "../types";
import { getStopNodes, parseScaleNodeName } from "./scaleUtilities";

function ceilToPowerOf10(number) {
    return Math.pow(10, Math.ceil(Math.log10(number)))
}

function interpretOptions(scaleNode: ScaleNode): LightnessScaleOptions {
    const { name, theme } = parseScaleNodeName(scaleNode.name)

    // TODO: figure out how to specify these colors.
    const referenceBase = cssColorToRGB('#6463EA')
    const referenceDarkest = cssColorToRGB('#0A081E')
    const referenceLightest = cssColorToRGB('#FBFBFF')

    const stopNodes = getStopNodes(scaleNode)
    const stopNumbers = stopNodes.map(node => parseInt(node.name))
    const stopNumbersMax = Math.max(...stopNumbers)
    const min = 0
    const max = ceilToPowerOf10(stopNumbersMax)
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

function toLighnessScale(options: LightnessScaleOptions): Scale {
    console.log(options)
    throw new Error("Not implemented")
}

export function interpretLighnessScaleNode(scaleNode: ScaleNode): Scale {
    const options = interpretOptions(scaleNode)
    const scale = toLighnessScale(options)
    return scale
}