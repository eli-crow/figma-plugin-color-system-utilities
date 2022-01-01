import { createOrUpdateScaleStyles } from "./scale/createOrUpdateScaleStyles"
import { interpretLighnessScaleNode } from "./scale/interpretLightnessScale"
import { filterToScaleNodes } from "./scale/scaleUtilities"

export function generateScale() {
    const selection = figma.currentPage.selection
    const scaleNodes = filterToScaleNodes(selection)
    const scales = scaleNodes.map(interpretLighnessScaleNode)
    scales.forEach(createOrUpdateScaleStyles)
}