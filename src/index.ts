import commands from './commands'

function unwrapParameters(parameters: ParameterValues): ParameterValues {
    if (!parameters) return {}
    return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key.split('.')[1], value]))
}

figma.parameters.on('input', (event: ParameterInputEvent) => {
    try {
        const [commandKey, parameterKey] = event.key.split('.')
        const command = commands[commandKey]
        const suggestions = command[parameterKey](event.query, event.parameters)
        event.result.setSuggestions(suggestions)
    } catch (error) {
        console.error(error)
    }
})

figma.on('run', async (event: RunEvent) => {
    try {
        const command = commands[event.command]
        const parameters = unwrapParameters(event.parameters)
        await command.execute(parameters)
    } catch (error) {
        figma.notify(error.message, { error: true, timeout: 3_000 })
        console.error(error)
    } finally {
        figma.closePlugin()
    }
})