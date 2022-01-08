import { Scale, ScaleNode } from "../types";
import { getScaleStopNodes, getScaleStopStyle, isScaleNode, isScaleStopName, isScaleStopNode, parseScaleNodeName } from "../utilities/scale";

function updateScaleNode(scale: Scale, scaleNode: ScaleNode) {
    const scaleStopNodes = getScaleStopNodes(scaleNode)
    scaleStopNodes.forEach(n => {

    })
}

function isScaleNodeForScale(scale: Scale, node: SceneNode | PageNode) {
    if (node.type === 'PAGE') return false
    if (!isScaleNode(node)) return false

    const { name, theme } = parseScaleNodeName(node.name)
    return name === scale.name && theme === scale.theme
}

export function updateScaleNodes(scale: Scale) {
    const scaleNodes = figma.root.findAll(node => isScaleNodeForScale(scale, node)) as unknown as ScaleNode[];
    scaleNodes.forEach(scaleNode => {
        const scaleStopNodes = getScaleStopNodes(scaleNode)
        scaleStopNodes.forEach((scaleStopNode) => {
            if (isScaleStopName(scaleStopNode.name)) {
                const style = getScaleStopStyle(scale, scaleStopNode.name)
                if (style) {
                    scaleStopNode.fillStyleId = style.id
                } else {
                    console.warn(`stop "${scaleStopNode.name}" not found`)
                }
            }
        })
    })
}