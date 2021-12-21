const SCALE_REFERENCE_COMPONENT_NAME = "$ScaleReference"
const SCALE_LIST_ELEMENT_NAME = "$scale"
const SCALE_DEFAULT_ELEMENT_NAME = "$default"
const SCALE_DEFAULT_REFERENCE_ELEMENT_NAME = "$defaultReference"
const DEFAULT_VARIANT_NAME = "DEFAULT"
const SATURATION_INDICATOR_ELEMENT_NAME = "$saturationIndicator"
const SATURATION_INDICATOR_SPACER_NAME = "$spacer"
const SATURATION_INDICATOR_VALUE_NAME = "$value"

import { ColorTuple, hsluvToRgb, lchToRgb, rgbToHsluv, rgbToLch } from "hsluv"
import convert from 'color-convert'

function getScaleReferenceComponent(): ComponentNode {
    const referenceComponents = figma.root.findAll(n =>
        n.type === 'COMPONENT' &&
        n.name === SCALE_REFERENCE_COMPONENT_NAME
    ) as ComponentNode[]

    if (referenceComponents.length === 0) {
        throw new Error(`Expected a component named "${SCALE_REFERENCE_COMPONENT_NAME}". This plugin is designed to be used with the "Color System Starter" community file.`)
    }

    if (referenceComponents.length > 1) {
        throw new Error(`Found more than one component named "${SCALE_REFERENCE_COMPONENT_NAME}". There should be exactly one.`)
    }

    return referenceComponents[0]
}

function getInstances(page: PageNode, selected: boolean = false): InstanceNode[] {
    const isInstance = node =>
        node.type === "INSTANCE" &&
        node.visible &&
        node.mainComponent.parent?.name === SCALE_REFERENCE_COMPONENT_NAME &&
        node.name.startsWith("$")

    const instances = selected
        ? page.selection.filter(isInstance) as InstanceNode[]
        : page.findAll(isInstance) as InstanceNode[]

    if (instances.length === 0) {
        throw new Error(`Please select one or more instances of "${SCALE_REFERENCE_COMPONENT_NAME}" component at the root level with a layer name like "$hue".`)
    }

    return instances
}

function getVariantElements(instance: InstanceNode) {
    const scaleElements = instance.findAll(n => n.name === SCALE_LIST_ELEMENT_NAME) as ChildrenMixin[]
    const variantElements = scaleElements.flatMap(scaleElement => {
        return scaleElement.children.filter(node =>
            node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'VECTOR' || node.type === 'INSTANCE' &&
            !(node.name.startsWith('.') || node.name.startsWith('_')) &&
            node.fills !== figma.mixed && node.fills.length === 1 && node.fills[0].type === 'SOLID'
        )
    }) as (MinimalFillsMixin & SceneNode)[]
    return variantElements
}

interface Variant {
    name: string
    paint: SolidPaint
}
interface Scale {
    theme: string
    hue: string
    variants: Variant[],
    isDark: boolean,
}
function toScale(instance: InstanceNode, page: PageNode): Scale {
    const theme = page.name.trim().replace("$", '')
    const hue = instance.name.trim().replace("$", '')
    const variants: Variant[] = []

    // TODO: edge cases here: default element has anything oother than exactly one solid fill
    const defaultElement = instance.findChild(n => n.name === SCALE_DEFAULT_ELEMENT_NAME) as MinimalFillsMixin & SceneNode
    if (!defaultElement) {
        throw new Error(`Could not find default element named "\$${SCALE_DEFAULT_ELEMENT_NAME}"`)
    }
    variants.push({
        name: DEFAULT_VARIANT_NAME,
        paint: defaultElement.fills[0]
    })

    const variantElements = getVariantElements(instance)
    if (variantElements.length === 0) {
        throw new Error("Did not find any scale variants. Scale elements should have exactly one solid fill.")
    }
    variantElements.forEach(n => {
        // TODO handle the case where there is already a fill style assigned to this element.
        variants.push({
            name: n.name.trim(),
            paint: n.fills[0]
        })
    })

    return { theme, hue, variants, isDark: theme === 'dark' }
}

function createOrUpdateScaleStyle(theme: string, hue: string, variant: string, paint: SolidPaint) {
    const styleName = getScaleStyleName(theme, hue, variant)
    const style = figma.getLocalPaintStyles().find(s => s.name.replaceAll(/\s+/g, '') === styleName) ?? figma.createPaintStyle()
    style.name = styleName
    style.paints = [paint]
    // style.description
    // maybe: calculate contrast against the background color? Other useful info and put in description?
}

function updateStyles(scale: Scale) {
    scale.variants.forEach(({ name, paint }) => {
        if (name === 'white' || name === 'black') {
            // HACK: this should be handled upstream, but it's not working properly
            return
        }
        createOrUpdateScaleStyle(scale.theme, scale.hue, name, paint)
    })
    // TODO: delete all styles in theme/hue/ that aren't in scale.variants
}

async function updateSaturationIndicator(instance: InstanceNode, isDarkTheme) {
    const reference = instance.findOne(node => node.name === SCALE_DEFAULT_REFERENCE_ELEMENT_NAME) as ChildrenMixin & SceneNode & MinimalFillsMixin
    const indicator = reference.findOne(node => node.name === SATURATION_INDICATOR_ELEMENT_NAME) as ChildrenMixin & SceneNode
    const spacer = indicator.findOne(node => node.name === SATURATION_INDICATOR_SPACER_NAME) as TextNode
    const value = indicator.findOne(node => node.name === SATURATION_INDICATOR_VALUE_NAME) as TextNode

    // TODO: get DEFAULT variant more intelligently
    const { r, g, b } = ((reference.fills as Paint[]).find(p => p.type === 'SOLID') as SolidPaint).color
    const [h, ,] = convert.rgb.hsv([r * 255, g * 255, b * 255])
    const rgbSaturated = convert.hsv.rgb([h, 100, 100])
    const [, , lightness] = rgbToHsluv(rgbSaturated.map(v => v / 255))

    // TODO: get list of varriants from numeric scale
    const stops = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].sort((a, b) => a - b)
    const i1 = stops.findIndex(stop => stop / 10 > lightness)
    const i0 = i1 - 1
    const l1 = stops[i1] / 10
    const l0 = stops[i0] / 10
    const y1 = i1 / stops.length
    const y0 = i0 / stops.length

    let y = 0
    let intensity = 0
    if (isDarkTheme) {
        const t = (lightness - l0) / (l1 - l0)
        y = y0 + (t * (y1 - y0))
        intensity = lightness * 10
    } else {
        // TODO: check this
        const invertedLightness = 100 - lightness
        const t = (invertedLightness - l0) / (l1 - l0)
        y = y0 + (t * (y1 - y0))
        intensity = invertedLightness * 10
    }

    indicator.visible = true

    await loadFontsForText(spacer)
    spacer.visible = true
    spacer.characters = ' '
    spacer.lineHeight = { value: reference.height * y, unit: "PIXELS" }

    await loadFontsForText(value)
    value.characters = Math.round(intensity).toString()
}

async function updateInstances(theme: string, hue: string) {
    // TODO: apply color to against default reference
    // TODO: find any non-gray styles inside sample and apply corresponding color
    // TODO: update tilte to reflect implied name

    const page = figma.root.children.find(p => p.name === `\$${theme}`)
    if (!page) {
        throw new Error(`Expected a page named "\$${theme}"`)
    }

    // TODO: base isDarkTheme on the backgorundColor of the page.
    const isDarkTheme = theme === 'dark'

    const paintStyles = figma.getLocalPaintStyles()
    const instances = getInstances(page).filter(i => i.name.trim().replace('$', '') === hue)
    const promises = instances.map(async instance => {
        const defaultElement = instance.findChild(n => n.name === SCALE_DEFAULT_ELEMENT_NAME) as MinimalFillsMixin & SceneNode
        const defaultReferenceElement = instance.findChild(n => n.name === SCALE_DEFAULT_REFERENCE_ELEMENT_NAME) as MinimalFillsMixin
        const defaultMatchingStyle = findScaleStyle(paintStyles, theme, hue, DEFAULT_VARIANT_NAME)
        if (defaultMatchingStyle) {
            defaultElement.fillStyleId = defaultMatchingStyle.id
            defaultReferenceElement.fillStyleId = defaultMatchingStyle.id
        }

        const variantElements = getVariantElements(instance)
        variantElements.forEach(node => {
            const expectedVariant = node.name.trim().replace('$', '')
            if (['white', 'black'].includes(expectedVariant)) return
            const matchingStyle = findScaleStyle(paintStyles, theme, hue, expectedVariant)
            if (matchingStyle) {
                node.fillStyleId = matchingStyle.id
            }
        })

        await updateSaturationIndicator(instance, isDarkTheme)
    })
    await Promise.all(promises)
}

function getScaleStyleName(theme: string, hue: string, variant: string) {
    return `${theme}/${hue}/${variant}`
}

function getScaleStyleNameRegex(theme: string, hue: string, variant: string) {
    return RegExp(`${theme}\s*/\s*${hue}\s*/\s*${variant}`)
}

function findScaleStyle(styles: PaintStyle[], theme: string, hue: string, variant: string) {
    const regex = getScaleStyleNameRegex(theme, hue, variant)
    return styles.find(style => style.name.match(regex))
}

function findScaleColorRgb01(styles: PaintStyle[], theme: string, hue: string, variant: string): ColorTuple {
    const style = findScaleStyle(styles, theme, hue, variant)
    const solid = style.paints[0] as SolidPaint
    return [solid.color.r, solid.color.g, solid.color.b]
}

async function loadFontsForText(node: TextNode) {
    const fonts = node.getRangeAllFontNames(0, node.characters.length)
    await Promise.all(fonts.map(font => figma.loadFontAsync(font)))
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max)
}

function clamp01(n: number) {
    return Math.min(Math.max(n, 0), 1)
}

function snapScale(scale: Scale, getRgb: (variant: Variant, base: ColorTuple, old: ColorTuple) => ColorTuple) {
    const styles = figma.getLocalPaintStyles()
    const defaultRgb = findScaleColorRgb01(styles, scale.theme, scale.hue, DEFAULT_VARIANT_NAME)
    scale.variants.forEach(variant => {
        const { r, g, b } = variant.paint.color
        const newRgb = getRgb(variant, defaultRgb, [r, g, b]).map(clamp01)
        const paint: SolidPaint = {
            type: "SOLID",
            color: { r: newRgb[0], g: newRgb[1], b: newRgb[2] },
            visible: true
        }
        createOrUpdateScaleStyle(scale.theme, scale.hue, variant.name, paint)
    })
}

async function forEachSelectedScale(visitor: (scale: Scale) => Promise<void> | void) {
    const page = figma.currentPage
    const selectedInstances = getInstances(page, true)
    const scales = selectedInstances.map(instance => toScale(instance, page))
    const promises = scales.map(visitor)
    await Promise.all(promises)
}

// TODO: async function snapLighness

const commands = {
    async generateScaleStyles() {
        await forEachSelectedScale(async scale => {
            updateStyles(scale)
            await updateInstances(scale.theme, scale.hue)
        })
    },

    async updateScaleReferences() {
        await forEachSelectedScale(async scale => {
            await updateInstances(scale.theme, scale.hue)
        })
    },

    async snapScale(parameters: ParameterValues) {
        await forEachSelectedScale(async scale => {
            snapScale(scale, (variant, base, old) => {
                const baseLch = rgbToLch(base)
                const oldLch = rgbToLch(old)
                const intensity = parseInt(variant.name)
                if (Number.isNaN(intensity)) {
                    console.warn(`Variant "${variant.name}" was ignored because it is not a number between 0 and 1000`)
                    return old
                }
                const luma = scale.isDark
                    ? (intensity / 10)
                    : 100 - (intensity / 10)
                if (parameters.property.toLowerCase() === 'luma') {
                    return lchToRgb([luma, oldLch[1], oldLch[2]]) as ColorTuple
                }
                else if (parameters.property.toLowerCase() === 'chroma') {
                    return lchToRgb([oldLch[0], baseLch[1], oldLch[2]]) as ColorTuple
                }
                else if (parameters.property.toLowerCase() === 'hue') {
                    return lchToRgb([oldLch[0], oldLch[1], baseLch[2]]) as ColorTuple
                }
                else {
                    return lchToRgb([luma, baseLch[1], baseLch[2]]) as ColorTuple
                }
            })
            // necessary to update?
            await updateInstances(scale.theme, scale.hue)
        })
    },

    //TODO: blendScale
    // for a selection of fillable nodes with numeric names in the range (0, 1000), where all elements share a parent
    // use catmullRom interpolation to generate blended colors for unselected variants in HCL space
    // the hues of black and white should be interpreted from the nearest selected variant

    //TODO: regenerateAllScales
    // For each page starting with $
    // delete any tokens starting with the page’s name excluding “$”
    // For each instance of $ScaleReference on that page,
    // generateScaleFromDefault()
    // blocker: how do you determine whether the theme is lightish or darkish? What is the threshold?

    //TODO: changeTheme <theme>
    // use parameters, find the right color based on name. same hue, different theme

    //TODO: changeHue
    // use parameters, find the right color based on name. same theme, different hue
}
figma.parameters.on('input', ({ parameters, key, query, result }: ParameterInputEvent) => {
    switch (key) {
        case 'property':
            result.setSuggestions(["Chroma", "Luma", "Hue", "All"])
            break

        default:
            return
    }
})
figma.on('run', async ({ command, parameters }: RunEvent) => {
    const commandToRun = commands[command]
    if (commandToRun) {
        await commandToRun(parameters)
    } else {
        throw new Error(`Command "${figma.command}" not found.`)
    }
    figma.closePlugin()
})