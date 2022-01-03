import { GradientScaleOptions } from "../gradient/interpretGradientNode";
import { GradientNode } from "../types";
import { nextPowerOf10, remap } from "./number";

// tests: https://regexr.com/6cj0n
const GRADIENT_NODE_NAME_REGEX = /^\s*?\$scale\s*?=\s*?([\S].+)\s*$/
const SLASH_SEPARATOR = /\s*\/\s*/g
const STOP_LIST = /\{\s*(.+)\s*\}/
const STOP_LIST_SEPARATOR = /\s*,\s*/g
const DEFAULT_STOP_OFFSETS: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

export function filterToGradientNodes(nodes: readonly SceneNode[]) {
    return nodes.filter(node => (node as MinimalFillsMixin).fills?.[0]?.type === 'GRADIENT_LINEAR') as unknown as GradientNode[]
}

function parseStopList(stopListContent: string) {
    const stopNumbers = stopListContent.split(new RegExp(STOP_LIST_SEPARATOR)).map(str => parseInt(str))
    const min = 0
    const max = nextPowerOf10(Math.max(...stopNumbers))
    const stopOffsets = stopNumbers.map(n => n / max)
    return { min, max, stopOffsets }
}

interface ParsedGradientNodeName {
    theme: GradientScaleOptions['theme'] | null;
    name: GradientScaleOptions['name']
    min: GradientScaleOptions['min']
    max: GradientScaleOptions['max']
    stopOffsets: GradientScaleOptions['stopOffsets']
}
export function parseGradientNodeName(nodeName: string): ParsedGradientNodeName {
    const match = nodeName.trim().match(GRADIENT_NODE_NAME_REGEX)

    if (!match) return null

    const content = match[1]
    const segments = content.split(new RegExp(SLASH_SEPARATOR))

    if (segments.length === 0) return null

    if (segments.length === 1) {
        return {
            theme: null,
            name: segments[0],
            min: 0,
            max: 1000,
            stopOffsets: [...DEFAULT_STOP_OFFSETS],
        }
    }

    if (segments.length === 2) {
        const [maybeFolderOrName, maybeNameOrStopList] = segments
        const stopListMatch = maybeNameOrStopList.match(new RegExp(STOP_LIST))

        if (stopListMatch) {
            const name = maybeFolderOrName
            const theme = null
            const fromStopList = parseStopList(stopListMatch[1])
            return { theme, name, ...fromStopList }
        }

        else {
            return {
                theme: maybeFolderOrName,
                name: maybeNameOrStopList,
                min: 0,
                max: 1000,
                stopOffsets: [...DEFAULT_STOP_OFFSETS],
            }
        }
    }

    else {
        const [theme, name, stopList] = segments
        const fromStopList = parseStopList(stopList)
        return { theme, name, ...fromStopList }
    }
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