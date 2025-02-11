const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['./plugin/src/index.ts'],
  outfile: './plugin/index.js',
  bundle: true,
  packages: 'external',
  external: ['../package.json'],
  allowOverwrite: true,
  logLevel: 'warning',
  platform: 'node',
  sourcemap: 'linked',
  minify: true,
})
