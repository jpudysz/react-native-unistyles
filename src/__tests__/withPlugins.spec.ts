import { unistyles } from '../core'
import type { UnistylesPlugin } from '../types'
import { withPlugins } from '../utils'

jest.mock('../core', () => {
    const registry = {
        plugins: [] as Array<UnistylesPlugin>
    }

    const mockedUnistyles = {
        registry,
        runtime: {
            addPlugin: (plugin: UnistylesPlugin) => {
                registry.plugins = [...registry.plugins, plugin]
            }
        }
    }

    return {
        unistyles: mockedUnistyles
    }
})

describe('withPlugins', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should return same style for no plugins', () => {
        const stylesheet = {
            container: {
                flex: 1
            },
            text: {
                fontSize: 16
            }
        }

        const result1 = withPlugins('container', stylesheet.container)
        const result2 = withPlugins('text', stylesheet.text)

        expect(result1).toEqual(stylesheet.container)
        expect(result2).toEqual(stylesheet.text)
    })

    it('should do nothing if plugin doesn\'t implement onParsedStyle', () => {
        const stylesheet = {
            container: {
                flex: 1
            },
            text: {
                fontSize: 16
            }
        }

        unistyles.runtime.addPlugin({
            name: 'test',
            onParsedStyle: undefined
        })

        const result1 = withPlugins('container', stylesheet.container)
        const result2 = withPlugins('text', stylesheet.text)

        expect(result1).toEqual(stylesheet.container)
        expect(result2).toEqual(stylesheet.text)
    })

    it('should transform styles based on onParsedStyle transformer', () => {
        const stylesheet = {
            container: {
                flex: 1
            }
        }

        unistyles.runtime.addPlugin({
            name: 'test',
            onParsedStyle: (key, style) => {
                if (key === 'container') {
                    return {
                        ...style,
                        backgroundColor: 'red'
                    }
                }

                return style
            }
        })

        const result = withPlugins('container', stylesheet.container)

        expect(result).toEqual({
            flex: 1,
            backgroundColor: 'red'
        })
    })

    it ('should call multiple plugins in order', () => {
        const stylesheet = {
            box: {
                width: 100,
                height: 200
            }
        }

        const pluginMultiplyBy2: UnistylesPlugin = {
            name: 'plugin1',
            onParsedStyle: (_key, style) => {
                const entires = Object.entries(style)

                return Object.fromEntries(entires.map(([key, value]) => {
                    if (key === 'width') {
                        return [key, value * 2]
                    }

                    if (key === 'height') {
                        return [key, value * 2]
                    }

                    return [key, value]
                }))
            }
        }
        const pluginDivideBy2: UnistylesPlugin = {
            name: 'plugin2',
            onParsedStyle: (_key, style) => {
                const entires = Object.entries(style)

                return Object.fromEntries(entires.map(([key, value]) => {
                    if (key === 'width') {
                        return [key, value / 2]
                    }

                    if (key === 'height') {
                        return [key, value / 2]
                    }

                    return [key, value]
                }))
            }
        }
        const pluginAdd25: UnistylesPlugin = {
            name: 'plugin3',
            onParsedStyle: (_key, style) => {
                const entires = Object.entries(style)

                return Object.fromEntries(entires.map(([key, value]) => {
                    if (key === 'width') {
                        return [key, value + 25]
                    }

                    if (key === 'height') {
                        return [key, value + 25]
                    }

                    return [key, value]
                }))
            }
        }

        unistyles.runtime.addPlugin(pluginMultiplyBy2)
        unistyles.runtime.addPlugin(pluginDivideBy2)
        unistyles.runtime.addPlugin(pluginAdd25)

        const result = withPlugins('box', stylesheet.box)

        expect(result).toEqual({
            width: 125,
            height: 225
        })
    })
})
