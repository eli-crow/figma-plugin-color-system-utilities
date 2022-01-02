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

export interface ScaleStop {
    name: string;
    offset: number;
    color: RGB;
}

export interface Scale {
    type: "lightness";
    name: string;
    theme: string | null;
    stops: ScaleStop[];
}

export interface LightnessScaleOptions {
    name: Scale['name'];
    theme: Scale['theme'];
    min: number;
    max: number;
    referenceLightest: RGB;
    referenceBase: RGB;
    referenceDarkest: RGB;
    stopOffsets: number[];
}

export interface GradientNode extends MinimalFillsMixin {
    fills: [GradientPaint]
}