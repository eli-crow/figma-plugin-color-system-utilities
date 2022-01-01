import { Scale, ScaleStop, ScaleNode, ScaleStopNode } from "../types"

const SCALE_NODE_NAME_REGEX = /^\$scale\s*?=\s*?([\S]+?)(?:\s*?\/\s*?([\S]+?)\s*?)?$/
const SCALE_STOP_NODE_NAME_REGEX = /^[0-9]+$/

export function getScaleStyleName(scale: Scale, stop: ScaleStop) {
    if (scale.theme) return [scale.theme, scale.name, stop.name].join('/')
    else return [scale.name, stop.name].join('/')
}

export function isScaleStopName(name: string) {
    return name.trim().match(new RegExp(SCALE_STOP_NODE_NAME_REGEX)) !== null
}

export function isScaleStop(node: SceneNode) {
    const fills = node as MinimalFillsMixin
    return (
        isScaleStopName(node.name) &&
        (
            fills.fillStyleId !== ''
            || fills.fills !== figma.mixed && fills.fills.length === 1 && fills.fills[0].type === 'SOLID'
        )
    )
}

export function getStopNodes(scaleNode: ScaleNode): ScaleStopNode[] {
    return scaleNode.children.filter(isScaleStop) as ScaleStopNode[]
}

export function isScale(node: SceneNode) {
    return Boolean(
        node.name.trim().match(new RegExp(SCALE_NODE_NAME_REGEX)) &&
        (node as ChildrenMixin).children?.some(isScaleStop)
    )
}

export function filterToScaleNodes(nodes: readonly SceneNode[]): ScaleNode[] {
    return nodes.filter(isScale) as unknown as ScaleNode[]
}

export function parseScaleNodeName(scaleNodeName: string) {
    const [, maybeThemeOrName, maybeName] = scaleNodeName.match(new RegExp(SCALE_NODE_NAME_REGEX))
    const theme = maybeName ? maybeThemeOrName : null
    const name = maybeName ?? maybeThemeOrName

    return {
        theme,
        name,
    }
}