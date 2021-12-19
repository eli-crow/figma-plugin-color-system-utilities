const SCALE_REFERENCE_COMPONENT_NAME = "$ScaleReference"
const SCALE_LIST_ELEMENT_NAME = "$scale"
const SCALE_DEFAULT_ELEMENT_NAME = "$default"
const DEFAULT_VARIANT_NAME = "DEFAULT"

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

function getScaleInstances(page: PageNode, selected: boolean = false): InstanceNode[] {
    const isInstance = node =>
        node.type === "INSTANCE" &&
        node.visible &&
        node.mainComponent.name === SCALE_REFERENCE_COMPONENT_NAME &&
        node.name.startsWith("$")

    const instances = selected
        ? page.selection.filter(isInstance) as InstanceNode[]
        : page.findAll(isInstance) as InstanceNode[]

    if (instances.length === 0) {
        throw new Error(`Please select one or more instances of "${SCALE_REFERENCE_COMPONENT_NAME}" component at the root level with a layer name like "$hue"`)
    }

    return instances
}

function getVariantElements(instance: InstanceNode) {
    const scaleElements = instance.findAll(n => n.name === SCALE_LIST_ELEMENT_NAME) as ChildrenMixin[]
    const variantElements = scaleElements.flatMap(scaleElement => {
        return scaleElement.children.filter(node =>
            node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'VECTOR' &&
            node.name.trim() !== 'black' && node.name.trim() !== 'white' &&
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
    variants: Variant[]
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

    return { theme, hue, variants }
}

function createOrUpdateScaleStyle(theme: string, hue: string, variant: string, paint: SolidPaint) {
    const styleName = `${theme}/${hue}/${variant}`
    const style = figma.getLocalPaintStyles().find(s => s.name.replaceAll(/\s+/g, '') === styleName) ?? figma.createPaintStyle()
    style.name = styleName
    style.paints = [paint]
    // style.description
    // maybe: calculate contrast against the background color? Other useful info and put in description?
}

function regenerateStylesFromScale(scale: Scale) {
    scale.variants.forEach(({ name, paint }) => {
        if (name === 'white' || name === 'black') {
            // HACK: this should be handled upstream, but it's not working properly
            return
        }
        createOrUpdateScaleStyle(scale.theme, scale.hue, name, paint)
    })
    // TODO: delete all styles in theme/hue/ that aren't in scale.variants
}

function applyExistingStylesToScaleInstances(theme: string, hue: string) {
    const page = figma.root.children.find(p => p.name === `\$${theme}`)
    if (!page) {
        throw new Error(`Expected a page named "\$${theme}"`)
    }

    const paintStyles = figma.getLocalPaintStyles()
    const instances = getScaleInstances(page).filter(i => i.name.trim().replace('$', '') === hue)
    instances.forEach(instance => {
        const defaultElement = instance.findChild(n => n.name === SCALE_DEFAULT_ELEMENT_NAME) as MinimalFillsMixin & SceneNode
        const defaultExpectedVariant = DEFAULT_VARIANT_NAME
        const defaultRegex = RegExp(`${theme}\s*/\s*${hue}\s*/\s*${defaultExpectedVariant}`)
        const defaultMatchingStyle = paintStyles.find(style => style.name.match(defaultRegex))
        if (defaultMatchingStyle) {
            defaultElement.fillStyleId = defaultMatchingStyle.id
        }

        const variantElements = getVariantElements(instance)
        variantElements.forEach(node => {
            const expectedVariant = node.name.trim().replace('$', '')
            if (['white', 'black'].includes(expectedVariant)) return
            const regex = RegExp(`${theme}\s*/\s*${hue}\s*/\s*${expectedVariant}`)
            const matchingStyle = paintStyles.find(style => style.name.match(regex))
            if (matchingStyle) {
                node.fillStyleId = matchingStyle.id
            }
        })
    })
}

const commands = {
    generateStylesFromSelectedScales() {
        const page = figma.currentPage
        const instances = getScaleInstances(page, true)
        const scales = instances.map(instance => toScale(instance, page))
        scales.forEach(scale => {
            regenerateStylesFromScale(scale)
            applyExistingStylesToScaleInstances(scale.theme, scale.hue)
        })
    },

    //TODO: regenerateScale
    // generate a scale based on the default variant of the selected instance.
    // stretch: automate red / yellow shift for yellowish hues

    //TODO: blendScale
    // for a selection of fillable nodes with numeric names in the range (0, 1000), where all elements share a parent
    // use catmullRom interpolation to generate blended colors for unselected variants in HCL space
    // the hues of black and white should be interpreted from the nearest selected variant

    //TODO: regenerateAllScales
    // For each page starting with $
    // delete any tokens starting with the page’s name excluding “$”
    // For each instance of $ScaleReference on that page,
    // generateScaleFromDefault()

    //TODO: snapColor
    // find the right theme by finding the page with the background color most similar to the current page
    // for evey paint style with exactly one SolidPaint among the selection
    // find the most similar color among numeric variants in the right theme and apply the paint style
    // stretch: for every GradientStop in every GradientPaint, apply the fill color to the gradient stop.
    // stretch: for every
}

function main() {
    const commandToRun = commands[figma.command]
    if (commandToRun) {
        commandToRun()
    } else {
        throw new Error(`Command "${figma.command}" not found.`)
    }

    figma.closePlugin()
}

main()