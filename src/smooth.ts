import { ColorTuple, hsluvToLch, lchToHsluv } from "hsluv"

function catmullRom(a: number, b: number, c: number, d: number, t: number) {
    const n0 = -0.5 * a + 1.5 * b - 1.5 * c + 0.5 * d
    const n1 = a - 2.5 * b + 2.0 * c - 0.5 * d
    const n2 = -0.5 * a + 0.5 * c
    return (n0 * t ** 3) + (n1 * t ** 2) + (n2 * t) + b
}

function remap(n: number, from0: number, from1: number, to0: number, to1: number) {
    const t = (n - from0) / (from1 - from0)
    return to0 + (to1 - to0) * t
}

function mod(n: number, domain: number) {
    return (n + domain) % domain
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max)
}

function clampLch(lch: ColorTuple) {
    const [h, s, l] = lchToHsluv(lch)
    return hsluvToLch([
        mod(h, 360),
        Math.min(s, 100),
        clamp(l, 0, 100)
    ])
}

function interpolateSmooth(luma: number, known: ColorTuple[]) {
    const black: ColorTuple = [
        0,
        remap(0, known[0][0], known[1][0], known[0][1], known[1][1]),
        remap(0, known[0][0], known[1][0], known[0][2], known[1][2]),
    ]
    const white: ColorTuple = [
        100,
        remap(0, known[known.length - 1][0], known[known.length - 2][0], known[known.length - 1][1], known[known.length - 2][1]),
        remap(0, known[known.length - 1][0], known[known.length - 2][0], known[known.length - 1][1], known[known.length - 2][1]),
    ]
    const inferred = [
        // triplicate knots is trick to get sensible continuous curve at edges
        black, black, 
        ...known,
        white, white,
    ]

    const i3 = inferred.findIndex(lch => lch[0] > luma)
    const i4 = i3 + 1
    if (i3 < 2 || i4 >= inferred.length) throw new Error(`lighness out of range "${luma}"`)
    const i2 = i3 - 1
    const i1 = i3 - 2

    const c1 = inferred[i1]
    const c2 = inferred[i2]
    const c3 = inferred[i3]
    const c4 = inferred[i4]

    const t = remap(luma, c2[0], c3[0], 0, 1)

    return clampLch([
        luma,
        catmullRom(c1[1], c2[1], c3[1], c4[1], t),
        catmullRom(c1[2], c2[2], c3[2], c4[2], t)
    ])
}

export {
    interpolateSmooth
}