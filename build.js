const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const bundle = {
  entryPoints: ['src/app/index.js'],
  outfile: 'dist/wrgsmk-app.min.js',
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  format: 'iife',
  charset: 'utf8',
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(bundle);
    await ctx.watch();
    console.log(`[watch] ${bundle.outfile}`);
    return;
  }

  await esbuild.build(bundle);
  const stat = require('fs').statSync(bundle.outfile);
  const kb = (stat.size / 1024).toFixed(1);
  console.log(`[build] ${bundle.outfile} (${kb} KB)`);
  console.log('\nDone. Tag a release and push to deploy via jsDelivr.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
