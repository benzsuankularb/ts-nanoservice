/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const pkg = require(path.resolve('./package.json'));
const glob = require('glob');
const esbuild = require('esbuild');
const { argv } = require('process');

async function getFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function buildBundle(entry, outfile, options) {
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
  ];
  await esbuild.build({
    entryPoints: [entry],
    external,
    bundle: true,
    outfile,
    minify: true,
    sourcemap: true,
    target: ['esnext'],
    ...options
  });
}

async function buildFiles(globPattern, outdir, options) {
  const files = await getFiles(globPattern);
  await esbuild.build({
    entryPoints: files,
    bundle: false,
    outdir,
    minify: true,
    sourcemap: true,
    target: ['esnext'],
    ...options
  });
}

buildBundle('src/index.ts', 'build/index.js', {
  format: 'cjs',
});

buildBundle('src/index.ts', 'build/index.esm.js', {
  format: 'esm',
});