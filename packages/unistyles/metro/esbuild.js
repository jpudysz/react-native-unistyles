const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['./metro/src/index.ts'],
    outdir: './metro',
    bundle: true,
    packages: 'external',
    allowOverwrite: true,
    logLevel: 'warning',
    platform: 'node',
    minify: false,
})
