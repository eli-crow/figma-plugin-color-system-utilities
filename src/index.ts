import * as commands from './commands'

figma.on('run', async (e: RunEvent) => {
    try {
        const commandToRun = commands[e.command]
        await commandToRun(e.parameters)
    } finally {
        figma.closePlugin()
    }
})