import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Compile server.ts to dist/server.cjs (CommonJS for App Engine)
await esbuild.build({
  entryPoints: [path.join(rootDir, 'server.ts')],
  bundle: true,
  platform: 'node',
  outfile: path.join(rootDir, 'dist', 'server.cjs'),
  format: 'cjs',
  packages: 'external',
  sourcemap: false,
  minify: false,
});

console.log('Server compiled to dist/server.cjs');
