import { NATIVE_COMPONENTS_PATHS, REACT_NATIVE_COMPONENT_NAMES } from '../../plugin/src/consts'
import { unistyles } from '../src'

const expectedNativeComponents = [
    ...REACT_NATIVE_COMPONENT_NAMES,
    ...NATIVE_COMPONENTS_PATHS.imports.map((component) => component.mapTo),
].map((component) => `react-native-unistyles/components/native/${component}`)

describe('Vite plugin', () => {
    it('uses the react-native-unistyles plugin name', () => {
        expect(unistyles().name).toBe('react-native-unistyles')
    })

    it.each(['client', 'ssr', 'custom'])(
        'prebundles generated native imports for the %s environment',
        (environment) => {
            const configEnvironment = unistyles().configEnvironment

            expect(configEnvironment).toEqual(expect.any(Function))

            if (typeof configEnvironment !== 'function') {
                throw new Error('Expected configEnvironment to be a function')
            }

            expect(configEnvironment(environment, {}, { command: 'serve', mode: 'development' })).toEqual({
                optimizeDeps: {
                    include: expectedNativeComponents,
                },
            })
        },
    )
})
