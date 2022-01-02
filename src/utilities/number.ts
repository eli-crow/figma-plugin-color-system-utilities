export function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max)
}

export function clamp01(n) {
    return clamp(n, 0, 1)
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

export function unlerp(a: number, b: number, n: number) {
    return (n - a) / (b - a)
}

export function remap(n: number, from0: number, from1: number, to0: number, to1: number) {
    return lerp(to0, to1, unlerp(from0, from1, n))
}
export function ceilToPowerOf10(n: number) {
    return Math.pow(10, Math.ceil(Math.log10(n)))
}

export function equals(a: number, b: number) {
    return Math.abs(b - a) < Number.EPSILON
}