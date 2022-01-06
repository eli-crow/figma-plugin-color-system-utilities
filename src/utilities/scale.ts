import { createOrUpdateScaleStyles } from "../scale/createOrUpdateScaleStyles"
import { updateScaleNodes } from "../scale/updateScaleNodes"
import { Scale, ScaleStop, ScaleNode, ScaleStopNode } from "../types"
import { nextPowerOf10 } from "./number"

const SCALE_NODE_NAME_REGEX = /^\$scale\s*?=\s*?([\S]+?)(?:\s*?\/\s*?([\S]+?)\s*?)?$/
const SCALE_STYLE_NAME_REGEX = /^(?:(.+?)\/)?(.+?)\/(.+?)$/
const SCALE_STOP_NODE_NAME_REGEX = /^[0-9]+$/
const REFERENCE_GRADIENT_STYLE_NAME = '.reference-gradient'
const SCALE_STYLE_FOLDER_SEPARATOR = '/'

export function getScaleStyleName(scale: Scale, stopName: string) {
    if (scale.theme) return [scale.theme, scale.name, stopName].join('/')
    else return [scale.name, stopName].join('/')
}
function getScalePrefix(scale: string, folder?: string) {
    if (folder) return [folder, scale].join(SCALE_STYLE_FOLDER_SEPARATOR)
    else return scale + SCALE_STYLE_FOLDER_SEPARATOR
}

export function styleMatchesScaleStop(style: PaintStyle, scale: Scale, stop: ScaleStop) {
    const expectedName = getScaleStyleName(scale, stop.name)
    return style.name.trim() === expectedName
}

export function getScaleStopStyle(scale: Scale, stop: string): PaintStyle | null {
    return figma.getLocalPaintStyles().find(style => style.name === getScaleStyleName(scale, stop))
}

export function getScaleStopStyles(scale: string, folder?: string) {
    const styles = figma.getLocalPaintStyles()
    const prefix = getScalePrefix(scale, folder)
    return styles.filter(style => style.name.startsWith(prefix))
}

export function isScaleStopName(name: string) {
    return name.trim().match(new RegExp(SCALE_STOP_NODE_NAME_REGEX)) !== null
}

export function isScaleStopNode(node: SceneNode) {
    const fills = node as MinimalFillsMixin
    return (
        isScaleStopName(node.name) &&
        (
            fills.fillStyleId !== ''
            || fills.fills !== figma.mixed && fills.fills.length === 1 && fills.fills[0].type === 'SOLID'
        )
    )
}

export function getScaleStopNodes(scaleNode: ScaleNode): ScaleStopNode[] {
    return scaleNode.children.filter(isScaleStopNode) as ScaleStopNode[]
}

export function isScaleNode(node: SceneNode) {
    return (
        node.name.trim().match(new RegExp(SCALE_NODE_NAME_REGEX)) !== null &&
        (node as ChildrenMixin).children?.some(isScaleStopNode)
    )
}

export function filterToScaleNodes(nodes: readonly SceneNode[]): ScaleNode[] {
    return nodes.filter(isScaleNode) as unknown as ScaleNode[]
}

export function parseScaleNodeName(scaleNodeName: string) {
    const [, maybeThemeOrName, maybeName] = scaleNodeName.match(new RegExp(SCALE_NODE_NAME_REGEX))
    const theme = maybeName ? maybeThemeOrName : null
    const name = maybeName ?? maybeThemeOrName
    return { theme, name }
}

export function parseScaleStyleName(name: string) {
    const [, folder = null, scale, stopName] = name.match(new RegExp(SCALE_STYLE_NAME_REGEX))
    const stopValue = parseInt(stopName)
    return {
        folder,
        scale,
        stopName,
        stopValue: Number.isNaN(stopValue) ? null : stopValue,
    }
}

export function getScale(name: string, folder?: string): Scale {
    const styles = getScaleStopStyles(name, folder)

    const stops = styles.map<ScaleStop>(style => {
        const { stopName, stopValue } = parseScaleStyleName(style.name)
        return {
            name: stopName,
            offset: stopValue,
            color: (style.paints[0] as SolidPaint).color,
        }
    })

    const max = nextPowerOf10(Math.max(...stops.map(stop => stop.offset)))
    stops.forEach(stop => {
        if (stop.offset) stop.offset /= max
    })

    return {
        type: "lightness",
        name,
        stops,
        theme: folder,
    }
}

function isReferenceGradientStyleForScale(styleName: string, scale: Scale) {
    const expectedName = getReferenceGradientStyleName(scale)
    return styleName.trim() === expectedName
}

function getReferenceGradientStyleForScale(scale: Scale) {
    return figma.getLocalPaintStyles().find(style => isReferenceGradientStyleForScale(style.name, scale))
}

function getReferenceGradientStyleName(scale: Scale) {
    const segments = []
    if (scale.theme) segments.push(scale.theme)
    segments.push(scale.name)
    segments.push(REFERENCE_GRADIENT_STYLE_NAME)
    const name = segments.join('/')
    return name
}

function createOrUpdateReferenceGradientStyle(scale: Scale) {
    const style = getReferenceGradientStyleForScale(scale) ?? figma.createPaintStyle()
    style.name = getReferenceGradientStyleName(scale)
    style.paints = [scale.referenceGradient]
}

export function applyScale(scale: Scale) {
    createOrUpdateScaleStyles(scale)
    updateScaleNodes(scale)
    if (scale.referenceGradient) {
        createOrUpdateReferenceGradientStyle(scale)
        //TODO: updateGradientNodes(scale) or something???
    }
}