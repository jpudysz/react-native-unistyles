const fs = require('node:fs')
const path = require('node:path')

const packageScope = {
    name: 'react-native-unistyles',
    type: 'commonjs',
    exports: {
        '.': './index.js',
        './mocks': './mocks.js',
        './components/native/*': './components/native/*.js',
        './server': './server/index.js',
        './web': './web-only/index.js',
        './reanimated': './reanimated/index.js',
        './internal/server-unistyles-style': {
            'react-native': './core/ServerUnistylesStyle.noop.js',
            'react-server': './core/ServerUnistylesStyle.js',
            default: './core/ServerUnistylesStyle.noop.js',
        },
        './internal/server-style-resources': {
            'react-native': './web/css/serverStyleResources.noop.js',
            'react-server': './web/css/serverStyleResources.js',
            default: './web/css/serverStyleResources.noop.js',
        },
    },
}

const outputPath = path.join(__dirname, 'lib/commonjs/package.json')

fs.writeFileSync(outputPath, `${JSON.stringify(packageScope, null, 2)}\n`)
