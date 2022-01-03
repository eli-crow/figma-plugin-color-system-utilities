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
    referenceGradient?: GradientPaint;
}

export interface GradientNode extends MinimalFillsMixin {
    name: string;
    fills: [GradientPaint]
}