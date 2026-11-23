// the Babel plugin can't run next to the Metro or the Rspack integration, the error names the one that is enabled
import { transformSync } from '@babel/core'

import { METRO_ENV } from '../src/consts'
import plugin from '../src/index'

const transform = () =>
    transformSync(`import { View } from 'react-native'`, {
        filename: '/project/src/App.js',
        root: '/project',
        babelrc: false,
        configFile: false,
        plugins: [[plugin, { root: 'src' }]],
    })

describe('Babel plugin next to an integration', () => {
    afterEach(() => {
        delete process.env[METRO_ENV]
    })

    it('should name react-native-unistyles/metro', () => {
        process.env[METRO_ENV] = 'metro'

        expect(transform).toThrow('react-native-unistyles/metro is enabled in metro.config.js')
    })

    it('should name UnistylesPlugin', () => {
        process.env[METRO_ENV] = 'rspack'

        expect(transform).toThrow('UnistylesPlugin of react-native-unistyles/repack-plugin is enabled')
    })

    it('should run without an integration', () => {
        expect(transform).not.toThrow()
    })
})
