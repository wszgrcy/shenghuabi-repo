import * as esbuild from 'esbuild';

export const CommonConfig = {
  platform: 'node',
  bundle: true,
  splitting: false,
  // format: 'cjs',
  // keepNames: false,
  legalComments: 'external',
  external: [
    'vscode',
    '@node-rs/jieba-win32-x64-msvc',
    '@img/sharp-win32-x64',
    '@node-rs/jieba-linux-x64-gnu',
    '@node-rs/jieba-linux-x64-musl',
    '@napi-rs/canvas',
    'sharp',
    '@node-rs/jieba',
    'lightningcss',
    '@reflink/reflink',
    'onnxruntime-node',
    'tinypool',
  ],
  conditions: ['import', 'module', 'node', 'commonjs', 'require', 'default'],
  target: ['es2022', 'node20'],
  charset: 'ascii',
  mainFields: ['module', 'main'],
} as esbuild.BuildOptions;
