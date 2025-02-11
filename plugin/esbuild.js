const esbuild = require('esbuild');

// TODO: add yarn tsc &&
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
});
