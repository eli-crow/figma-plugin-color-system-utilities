export function normalizeStyleName(name: string) {
    return name.replaceAll(/\s/g, '')
}

export function getOrCreateStyle(name: string): PaintStyle {
    const styles = figma.getLocalPaintStyles()
    const existingStyle = styles.find(style => {
        const styleName = normalizeStyleName(style.name)
        const targetName = normalizeStyleName(name)
        return styleName === targetName
    })

    const style = existingStyle ?? figma.createPaintStyle()
    style.name = normalizeStyleName(name)

    return style
}