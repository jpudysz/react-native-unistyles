const babel = require('@babel/core')
const plugin = require('../src/index')

const filePath = '../../expo-example/app/(tabs)/index.tsx'

const result = babel.transformFileSync(filePath, {
    presets: ['@babel/preset-typescript', '@babel/preset-flow'],
    plugins: [plugin],
    filename: filePath
})

console.log(result.code)
