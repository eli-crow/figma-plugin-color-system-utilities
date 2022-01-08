export const REFERENCE_GRADIENT_STYLE_NAME = '.scale'
export const FOLDER_SEPARATOR_REGEX = /\s*\/\s*/g

export const DEFAULT_STOPS: readonly ScaleStop[] = [
    { name: "50", position: 0.05 },
    { name: "100", position: 0.1 },
    { name: "200", position: 0.2 },
    { name: "300", position: 0.3 },
    { name: "400", position: 0.4 },
    { name: "500", position: 0.5 },
    { name: "600", position: 0.6 },
    { name: "700", position: 0.7 },
    { name: "800", position: 0.8 },
    { name: "900", position: 0.9 },
]

type IgnoredNodeMixin = { name: string }
export type ScaleNode = { name: string, children: (ScaleStopNode | IgnoredNodeMixin)[] }

export type ScaleStopNode = { name: string, fills: readonly [SolidPaint], fillStyleId: string }

export interface HSLUV {
    h: number;
    s: number;
    l: number;
}

export interface LCH {
    l: number;
    c: number;
    h: number;
}

export interface Suggestion<T> {
    name: string;
    data?: T;
    icon?: (string | Uint8Array);
    iconUrl?: string
}

export interface ScaleStop {
    name: string;
    position: number;
}

export enum ScaleType {
    LightnessRelative = 'lightness-relative',
    LightnessAbsolute = 'lightness-absolute',
}

export interface ScaleOptions {
    type: ScaleType;
    stops: readonly ScaleStop[];
    baseColor: RGB;
}

export interface Scale {
    name: string;
    options: ScaleOptions;
    gradient: GradientPaint;
}

export interface LightnessRealtiveScaleOptions extends ScaleOptions {
    type: ScaleType.LightnessRelative;
}

export interface LightnessAbsoluteScaleOptions extends ScaleOptions {
    type: ScaleType.LightnessAbsolute;
}

export interface GradientNode extends MinimalFillsMixin {
    name: string;
    fills: [GradientPaint]
}