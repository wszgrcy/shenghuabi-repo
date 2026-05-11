import * as esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';
import * as path from 'path';

export async function buildWebgpuWindow() {
  const cwd = process.cwd();
  let OUT_DIR = path.join(cwd, '/dist/data/webgpu');
  const PROD_ENV = process.argv.includes('--prod');

  const baseOption: esbuild.BuildOptions = {
    bundle: true,
    splitting: false,
    outdir: OUT_DIR,
    minify: PROD_ENV,
    sourcemap: !PROD_ENV,
    legalComments: 'none',
    tsconfig: path.join(cwd, 'tsconfig.build.json'),
    external: ['vscode', 'electron', 'fs', 'path'],
    target: ['es2022', 'node20'],
    charset: 'utf8',
    mainFields: ['module', 'main'],
    define: {
      PROD_ENV: `${PROD_ENV}`,
    },
  };
  const options: esbuild.BuildOptions = {
    ...baseOption,
    platform: 'node',
    entryPoints: [
      {
        in: path.join(cwd, './webview/webgpu/preload.ts'),
        out: './preload',
      },
    ],
    format: 'cjs',
  };
  await esbuild.build(options);
  const mainOptions: esbuild.BuildOptions = {
    ...baseOption,
    platform: 'browser',
    entryPoints: [
      {
        in: path.join(cwd, './webview/webgpu/index.ts'),
        out: './index',
      },
      {
        in: path.join(cwd, './webview/webgpu/worker.ts'),
        out: './worker',
      },
    ],
    mainFields: ['browser', 'module', 'main'],
    format: 'esm',
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          {
            from: './node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm',
            to: './dist/data/webgpu',
          },
          {
            from: './webview/webgpu/index.html',
            to: './dist/data/webgpu',
          },
        ],
      }),
    ],
    outExtension: {
      '.js': '.mjs',
    },
  };
  await esbuild.build(mainOptions);
}
