import { Scale, ScaleStop } from "../types";
import { getScaleStyleName } from "../utilities/scale";

function findScaleStyle(scale: Scale, stop: ScaleStop) {
    const name = getScaleStyleName(scale, stop.name)
    const styles = figma.getLocalPaintStyles()
    return styles.find(style => {
        const normalizedName = style.name.replaceAll(/\s+/g, '')
        return normalizedName === name
    })
}

function updateScaleStyle(style: PaintStyle, scale: Scale, stop: ScaleStop) {
    style.name = getScaleStyleName(scale, stop.name)
    style.paints = [{
        type: 'SOLID',
        color: stop.color,
    }]
}

function createOrUpdateScaleStyle(scale: Scale, stop: ScaleStop) {
    const style = findScaleStyle(scale, stop) ?? figma.createPaintStyle()
    updateScaleStyle(style, scale, stop)
}

export function createOrUpdateScaleStyles(scale: Scale) {
    scale.stops.forEach((stop) => {
        createOrUpdateScaleStyle(scale, stop)
    })
}