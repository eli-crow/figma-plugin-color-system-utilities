import { REFERENCE_GRADIENT_STYLE_NAME, Scale, ScaleOptions } from "../types"
import { sampleGradient } from "../utilities/gradient"
import { getOrCreateStyle } from "../utilities/styles"

function isGradientPaint(paint: Paint) {
    return paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND'
}

function getReferenceGradientStyles() {
    return figma.getLocalPaintStyles().filter(p => p.name.trim().endsWith(REFERENCE_GRADIENT_STYLE_NAME))
}

function getScaleOptions(style: BaseStyle) {
    try {
        const options = JSON.parse(style.description) as ScaleOptions
        return options as ScaleOptions
    }
    catch (error) {
        throw new Error(`Invalid options in "${style.name}" style's description`)
    }
}

export function getScale(gradientStyle: PaintStyle): Scale {
    if (!isGradientPaint(gradientStyle.paints[0])) {
        throw new Error(`Expected a style named "${REFERENCE_GRADIENT_STYLE_NAME}" with exactly one gradient paint`)
    }

    const name = gradientStyle.name.replace(/\s*?\/\s*?.scale\s*?$/, '')
    const gradient = gradientStyle.paints[0] as GradientPaint
    const options = getScaleOptions(gradientStyle)

    return { name, options, gradient }
}

export function syncScaleStyles(scale: Scale) {
    scale.options.stops.forEach(stop => {
        const rgb = sampleGradient(scale.gradient, stop.position)
        const stopName = stop.name ?? stop.position.toString()
        const style = getOrCreateStyle(scale.name + '/' + stopName)
        style.paints = [{ type: 'SOLID', color: rgb }]
    })
}

export function syncAllScaleStyles() {
    getScales().forEach(syncScaleStyles)
}

export function getScales(): Scale[] {
    return getReferenceGradientStyles().map(getScale)
}

export function createScale(scale: Scale) {
    const gradientStyle = getOrCreateStyle(scale.name + '/' + REFERENCE_GRADIENT_STYLE_NAME)
    gradientStyle.description = JSON.stringify(scale.options)
    gradientStyle.paints = [scale.gradient]
    syncScaleStyles(scale)
    return gradientStyle
}