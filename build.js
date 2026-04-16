const esbuild = require('esbuild');
const path = require('path');

const watch = process.argv.includes('--watch');

const bundles = [
  {
    entryPoints: ['src/core/index.js'],
    outfile: 'dist/wrgsmk-core.min.js',
  },
  {
    entryPoints: ['src/pages/home/index.js'],
    outfile: 'dist/wrgsmk-home.min.js',
  },
  {
    entryPoints: ['src/pages/illustration/index.js'],
    outfile: 'dist/wrgsmk-illustration.min.js',
  },
  {
    entryPoints: ['src/pages/shop/index.js'],
    outfile: 'dist/wrgsmk-shop.min.js',
  },
  {
    entryPoints: ['src/pages/photography/index.js'],
    outfile: 'dist/wrgsmk-photography.min.js',
  },
];

const sharedOptions = {
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  format: 'iife',
  charset: 'utf8',
};

async function run() {
  for (const bundle of bundles) {
    const options = { ...sharedOptions, ...bundle };

    if (watch) {
      const ctx = await esbuild.context(options);
      await ctx.watch();
      console.log(`[watch] ${bundle.outfile}`);
    } else {
      const result = await esbuild.build(options);
      const stat = require('fs').statSync(bundle.outfile);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`[build] ${bundle.outfile} (${kb} KB)`);
    }
  }

  if (!watch) {
    console.log('\nDone. Tag a release and push to deploy via jsDelivr.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
