import { createOrUpdateScaleStyles } from "../scale/createOrUpdateScaleStyles"
import { updateScaleNodes } from "../scale/updateScaleNodes"
import { Scale, ScaleStop, ScaleNode, ScaleStopNode } from "../types"

const SCALE_NODE_NAME_REGEX = /^\$scale\s*?=\s*?([\S]+?)(?:\s*?\/\s*?([\S]+?)\s*?)?$/
const SCALE_STOP_NODE_NAME_REGEX = /^[0-9]+$/
const REFERENCE_GRADIENT_STYLE_NAME = '.reference-gradient'

export function getScaleStyleName(scale: Scale, stopName: string) {
    if (scale.theme) return [scale.theme, scale.name, stopName].join('/')
    else return [scale.name, stopName].join('/')
}

export function styleMatchesScaleStop(style: PaintStyle, scale: Scale, stop: ScaleStop) {
    const expectedName = getScaleStyleName(scale, stop.name)
    return style.name.trim() === expectedName
}

export function getScaleStopStyle(scale: Scale, stop: string): PaintStyle | null {
    return figma.getLocalPaintStyles().find(style => style.name === getScaleStyleName(scale, stop))
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