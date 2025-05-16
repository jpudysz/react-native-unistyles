const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['./repack-plugin/src/index.ts', './repack-plugin/src/loader.ts'],
    bundle: true,
    outdir: './repack-plugin',
    packages: 'external',
    external: ['../package.json'],
    allowOverwrite: true,
    logLevel: 'warning',
    platform: 'node',
    minify: false,
});
