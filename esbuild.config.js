const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production'
}).catch(() => process.exit(1));

