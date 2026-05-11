import * as esbuild from 'esbuild';
import * as path from 'path';
import { copy } from 'esbuild-plugin-copy';
import { CommonConfig } from './esbuild/common';

// 发布之前构建
async function main() {
  const { $ } = await import('execa');
  const cwd = process.cwd();
  let OUT_DIR = path.join(cwd, '/plugin-sdk-dist');
  await $({
    stdio: 'inherit',
  })`rimraf ./plugin-sdk-dist`;

  // await $({
  //   cwd: path.join(cwd, './src/sdk'),
  //   stdio: 'inherit',
  // })`npx tsc -p tsconfig.type.json`;
  const options: esbuild.BuildOptions = {
    ...CommonConfig,
    format: 'esm',
    entryPoints: [
      { in: path.join(cwd, './src/sdk/index.ts'), out: './index' },
      { in: path.join(cwd, './src/sdk/build.ts'), out: './build' },
    ],
    splitting: true,
    outdir: OUT_DIR,
    // keepNames: false,
    minify: false,
    sourcemap: true,
    tsconfig: path.join(cwd, 'src/sdk', 'tsconfig.json'),
    plugins: [
      copy({
        resolveFrom: 'cwd',
        // once: true,
        assets: [
          { from: './assets/sdk/*', to: './plugin-sdk-dist' },
          { from: './data/extension.js', to: './plugin-sdk-dist/public' },
        ],
      }),
    ],
    define: {},
    packages: 'external',
  };
  await Promise.all([
    $({
      stdio: 'inherit',
    })`tsc -p ./tsconfig.server-sdk.json`,

    esbuild.build(options),
  ]);
}

main();
