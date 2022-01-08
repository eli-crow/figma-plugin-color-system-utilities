import { FOLDER_SEPARATOR_REGEX } from "../types";

function getSwap(paintStyleId: string, pivot: string): string | null {
    const existingStyle = figma.getStyleById(paintStyleId) as PaintStyle
    const existingPath = existingStyle.name.trim().split(FOLDER_SEPARATOR_REGEX)

    for (let i = existingPath.length - 1; i >= 0; i--) {
        const preserveBefore = existingPath.slice(0, i)
        const preserveAfter = existingPath.slice(i + 1)
        const attemptedSwapPath = [...preserveBefore, pivot, ...preserveAfter]
        const attemptedSwapName = attemptedSwapPath.join('/')
        const style = figma.getLocalPaintStyles().find(style => style.name.replaceAll(/\s/g, '') === attemptedSwapName)
        if (style) return style.id
    }

    return null
}

function changeScale(node: SceneNode, pivot: string) {
    if ('fillStyleId' in node && node.fillStyleId !== figma.mixed && node.fillStyleId !== '') {
        const swap = getSwap(node.fillStyleId, pivot)
        if (swap) {
            node.fillStyleId = swap
        }
    }

    if ('strokeStyleId' in node && node.strokeStyleId !== '') {
        const swap = getSwap(node.strokeStyleId, pivot)
        if (swap) {
            node.strokeStyleId = swap
        }
    }

    if ('children' in node) {
        const parent = node as ChildrenMixin
        parent.children.forEach(child => changeScale(child, pivot))
    }
}

export {
    changeScale
} 