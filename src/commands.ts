import { filterToGradientNodes } from "./utilities/gradient"
import {
    fixGradientLightnessAbsolute as _fixGradientLightness,
    fixGradientLightnessRelative as _fixGradientLightnessRelative
} from './gradient/fixGradientLightness'
import { changeScale as _changeScale } from "./scale/change"
import { createScale as _createScale, syncAllScaleStyles } from "./scale/store"
import { ColorProperty, FOLDER_SEPARATOR_REGEX, Suggestion } from "./types"
import { interpretGradientNode } from "./scale/interpret"

function fuzzyMatch(a: string, b: string) {
    // todo find a simple fuzzy match
    return a.toLowerCase().includes(b.toLowerCase())
}

// confusing, but basically requires correctly typed suggestion functions for each parameter
type Command<
    Params extends ParameterValues = {},
    Key extends string = Extract<keyof Params, string>>
    =
    Record<Key, (query: string, parameters: Partial<Params>) => Suggestion<Params[Key]>[]>
    & { execute(parameters: Params): void | Promise<void> }

const changeScale: Command<{ pivot: string }> = {
    execute({ pivot }) {
        const selection = figma.currentPage.selection
        selection.forEach(node => _changeScale(node, pivot))
    },
    pivot(query: string) {
        const segments = figma.getLocalPaintStyles()
            .flatMap(scale => scale.name.split(RegExp(FOLDER_SEPARATOR_REGEX)))

        const unique = [...new Set(segments)]

        return unique
            .filter(pivot => !query || fuzzyMatch(pivot, query))
            .map(pivot => {
                return { name: pivot, data: pivot }
            })
    }
}

const createScale: Command<{ name: string }> = {
    execute({ name }) {
        const selection = figma.currentPage.selection
        const gradientNodes = filterToGradientNodes(selection)
        gradientNodes.forEach(node => {
            const scale = interpretGradientNode(node)
            if (name) scale.name = name
            const scaleStyle = _createScale(scale)
            node.fillStyleId = scaleStyle.id
        })
    },
    name(query: string) {
        const names = figma.currentPage.selection.map(node => node.name)
        return query ? [] : names.map(s => {
            return { name: s, data: s }
        })
    }
}

enum GradientLightnessMode {
    Absolute = 'absolute',
    Relative = 'relative',
}

const fix: Command<{ property: ColorProperty, mode: GradientLightnessMode }> = {
    execute({ mode, property }) {
        const selection = figma.currentPage.selection
        const gradientNodes = filterToGradientNodes(selection)
        if (property === ColorProperty.Lightness) {
            if (mode === GradientLightnessMode.Relative) {
                gradientNodes.forEach(_fixGradientLightnessRelative)
            } else {
                gradientNodes.forEach(_fixGradientLightness)
            }
        } else {
            throw new Error(`${property} not supported yet!`)
        }
    },
    property(query: string) {
        return Object.entries(ColorProperty)
            .filter(([key]) => fuzzyMatch(key, query))
            .map(([key, value]) => ({
                name: key,
                data: value
            }))
    },
    mode(query: string) {
        return Object.entries(GradientLightnessMode)
            .filter(([key]) => fuzzyMatch(key, query))
            .map(([key, value]) => ({
                name: key,
                data: value,
            }))
    },
}

const updateScaleStyles: Command = {
    execute() {
        syncAllScaleStyles()
    }
}

export default {
    changeScale,
    createScale,
    fix,
    updateScaleStyles
} as { [key: string]: Command }