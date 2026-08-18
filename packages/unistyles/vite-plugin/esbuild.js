const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['./vite-plugin/src/index.ts'],
    outfile: './vite-plugin/index.js',
    bundle: true,
    packages: 'external',
    external: ['../package.json'],
    allowOverwrite: true,
    logLevel: 'warning',
    platform: 'node',
    minify: false,
})
