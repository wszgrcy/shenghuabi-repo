import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'fast-glob';
import { CommonConfig } from './esbuild/common';
import copy from 'esbuild-plugin-copy';
import { arch, platform } from 'os';

async function main() {
  const build = process.argv.includes('--build');
  const cwd = process.cwd();

  let OUT_DIR = 'test-dist';
  let options: esbuild.BuildOptions = {
    ...CommonConfig,
    external: [
      'mocha',
      'bson',
      '@xyflow/react',
      'rfdc',
      'zod',
      'zod-to-json-schema',
      '@anthropic-ai/sdk',
      '@baiducloud/qianfan',
      '@qdrant/qdrant-js',
      '@trpc/client',
      '@trpc/server',
      // 'chevrotain',
      'chroma-js',
      // 'd3-interpolate',
      'debug',
      'decompress',
      'epub2',
      // 'execa',
      'extract-zip',
      'fast-diff',
      'fast-equals',
      'fast-glob',
      'fastest-levenshtein',
      'fastq',
      // 'file-type',
      'fs-extra',
      // 'got',
      'graphology',
      'handlebars',
      'heic-decode',
      'html-to-text',
      'htmlparser2',
      'interval-operations',
      'json-bigint',
      'jsonc-parser',
      'langchain',
      // '@langchain/community',
      '@langchain/core',
      'liquidjs',
      // 'lodash-es',
      'lru-cache',
      'magic-string',
      'mammoth',
      'marked',
      'mnemonist',
      'officeparser',
      'openai',
      'pdf-parse',
      'pinyin-pro',
      'react',
      'react-dom',
      'regexp.escape',
      'rxjs',
      'semver',
      'slash',
      // 'srt-parser-2',
      'tar',
      'tinycolor2',
      'topological-sort',
      'typescript',
      'yaml',
      ...CommonConfig.external!,
    ],
    sourcemap: 'linked',
    entryPoints: [
      ...glob.sync('./test/**/*.spec.ts', {}).map((item) => {
        return { in: item, out: path.join('', item.slice(0, -3)) };
      }),
      { in: './test/index.ts', out: 'test/index' },
      { in: path.join(cwd, './src/index.ts'), out: './index' },
    ],
    outdir: path.join(process.cwd(), OUT_DIR),

    tsconfig: 'tsconfig.spec.json',
    charset: 'utf8',

    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          { from: './language/*', to: `./${OUT_DIR}/language` },
          { from: './data/package.json', to: `./${OUT_DIR}` },
          {
            from: `./data/${platform()}-${arch()}/**/*`,
            to: `./${OUT_DIR}/data`,
          },
          { from: './data/common/**/*', to: `./${OUT_DIR}/data` },
        ],
      }),
    ],
    define: {
      PROD_ENV: `false`,
      TEST_ENV: `true`,
    },
    banner: { js: `const TEST_CWD=${JSON.stringify(process.cwd())}` },
  };
  await esbuild.build({
    platform: 'node',
    bundle: true,
    entryPoints: [
      {
        in: path.join(cwd, './src/worker/text2vec.ts'),
        //! 只能测试知识库使用,因为worker问题
        out: './test/knowledge/worker/text2vec',
      },
    ],
    tsconfig: path.join(cwd, 'tsconfig.worker.json'),
    minify: false,
    sourcemap: true,
    legalComments: 'external',
    format: 'esm',
    target: ['node20'],
    outdir: OUT_DIR,
    outExtension: {
      '.js': '.mjs',
    },
    charset: 'utf8',
    external: ['onnxruntime-node', 'sharp', '@reflink/reflink'],
    inject: [path.join(__dirname, './cjs-shim.ts')],
  });
  if (!build) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('构建完成');
  } else {
    await esbuild.build(options);
    console.log('构建完成');
  }
}
main();
