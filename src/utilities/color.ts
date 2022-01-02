import chroma from 'chroma-js'
import { hsluvToRgb, lchToRgb, rgbToHsluv, rgbToLch } from 'hsluv'
import { HSLUV, LCH } from '../types'
import { clamp01 } from './number'

export function cssColorToRGB(cssColor: string): RGB {
    const [r, g, b] = chroma(cssColor).gl()
    return { r, g, b }
}

export function rgbToHSLUV({ r, g, b }: RGB): HSLUV {
    const [h, s, l] = rgbToHsluv([r, g, b])
    return { h, s: s / 100, l: l / 100 }
}

export function rgbToLCH({ r, g, b }: RGB): LCH {
    const [l, c, h] = rgbToLch([r, g, b])
    return { l: l / 100, c: c / 100, h }
}

export function lchToRGB({ l, c, h }: LCH): RGB {
    const [r, g, b] = lchToRgb([l, c, h]).map(clamp01)
    return { r, g, b }
}

export function hsluvToRGB({ h, s, l }: HSLUV): RGB {
    const [r, g, b] = hsluvToRgb([h, s * 100, l * 100]).map(clamp01)
    return { r, g, b }
}