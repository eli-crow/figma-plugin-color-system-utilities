import chroma from 'chroma-js'
import { hsluvToRgb, rgbToHsluv } from 'hsluv'
import { HSLUV } from '../types'

export function cssColorToRGB(cssColor: string): RGB {
    const [r, g, b] = chroma(cssColor).gl()
    return { r, g, b }
}

export function rgbToHSLUV({ r, g, b }: RGB): HSLUV {
    const [h, s, l] = rgbToHsluv([r, g, b])
    return { h, s, l }
}

export function hsluvToRGB({ h, s, l }: HSLUV): RGB {
    const [r, g, b] = hsluvToRgb([h, s, l])
    return { r, g, b }
}