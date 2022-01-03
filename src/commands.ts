import { createOrUpdateScaleStyles } from "./scale/createOrUpdateScaleStyles"
import { interpretLighnessScaleNode } from "./scale/interpretLightnessScale"
import { updateScaleNodes } from "./scale/updateScaleNodes"
import { applyScale, filterToScaleNodes } from "./utilities/scale"
import { filterToGradientNodes } from "./utilities/gradient"
import {
    fixGradientLightness as _fixGradientLightness,
    fixGradientLightnessRelative as _fixGradientLightnessRelative
} from './gradient/fixGradientLightness'
import { interpretGradientNode } from "./gradient/interpretGradientNode"

export function generateScale() {
    const selection = figma.currentPage.selection
    const scaleNodes = filterToScaleNodes(selection)
    const scales = scaleNodes.map(interpretLighnessScaleNode)
    scales.forEach(applyScale)
}

export function createScaleStylesFromGradient() {
    const selection = figma.currentPage.selection
    const gradientNodes = filterToGradientNodes(selection)
    const scales = gradientNodes.map(interpretGradientNode)
    scales.forEach(applyScale)
}

export function fixGradientLightness() {
    const selection = figma.currentPage.selection
    const gradientNodes = filterToGradientNodes(selection)
    gradientNodes.forEach(_fixGradientLightness)
}

export function fixGradientLightnessRelative() {
    const selection = figma.currentPage.selection
    const gradientNodes = filterToGradientNodes(selection)
    gradientNodes.forEach(_fixGradientLightnessRelative)
}