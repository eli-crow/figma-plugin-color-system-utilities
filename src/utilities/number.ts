export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)
export const clamp01 = (n: number) => clamp(n, 0, 1)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const unlerp = (a: number, b: number, n: number) => (n - a) / (b - a)
export const remap = (n: number, from0: number, from1: number, to0: number, to1: number) => lerp(to0, to1, unlerp(from0, from1, n))
export const nextPowerOf10 = (n: number) => Math.pow(10, Math.ceil(Math.log10(n)))
export const equals = (a: number, b: number) => Math.abs(b - a) < Number.EPSILON