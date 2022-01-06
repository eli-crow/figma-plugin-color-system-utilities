import { getScale } from "../utilities/scale"


type SupportedNode = SceneNode & (MinimalFillsMixin | MinimalStrokesMixin)
function swapScale(nodes: SupportedNode[], scaleName: string, folder?: string) {
    const scale = getScale(scaleName, folder)
    console.log(scale)
}

export {
    swapScale
} 