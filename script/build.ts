import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { arch, platform } from 'os';
import { readFileSync, writeFileSync } from 'fs';
import { readdirSync, rmdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildWebgpuWindow } from './webgpu/build';
import { rimraf } from 'rimraf';
import { CommonConfig } from './esbuild/common';
import { swcPlugin } from './plugin/swc.plugin';
import { importRequirePlugin } from './plugin/import-require';
import * as fs from 'fs';
// 发布之前构建
async function main() {
  const { path } = await import('@cyia/vfs2');

  const watch = process.argv.includes('--watch');
  const PROD_ENV = process.argv.includes('--prod');
  const cwd = process.cwd();
  let OUT_DIR = path.join(cwd, '/dist');
  const language = `zh-CN`;
  let navigatorData = JSON.stringify({
    language: language,
    platform: '',
    userAgent: '',
  });
  const Define = {
    PROD_ENV: `${PROD_ENV}`,
    TEST_ENV: `false`,
    'process.env.PUBLISH_VERSION': `"${process.env['PUBLISH_VERSION']!}"`,
    'process.platform': `'${process.platform}'`,
    'process.arch': `'${process.arch}'`,
    navigator: navigatorData,
    'navigator.language': `'${language}'`,
    'process.type': `'browser'`,
  };
  const options: esbuild.BuildOptions = {
    ...CommonConfig,
    format: 'esm',
    treeShaking: true,
    // 临时关闭切包等解决
    splitting: true,
    entryPoints: [
      { in: path.join(cwd, './src/index.ts'), out: './index' },
      {
        in: path.join(cwd, 'node_modules/@shenghuabi/knowledge/worker/ocr.mjs'),
        out: './worker/ocr',
      },
      {
        in: path.join(cwd, 'node_modules/@shenghuabi/knowledge/worker/text2vec.mjs'),
        out: './worker/text2vec',
      },
      {
        in: path.join(cwd, 'node_modules/@shenghuabi/knowledge/worker/reranker.mjs'),
        out: './worker/reranker',
      },
    ],
    outdir: OUT_DIR,
    // keepNames: false,
    minify: PROD_ENV,
    sourcemap: true,
    tsconfig: path.join(cwd, 'tsconfig.build.json'),
    // metafile: true,
    banner: {
      js: [
        `import { createRequire as ɵcreateRequire } from 'node:module';`,
        `import ɵpath from 'node:path';`,
        `import ɵurl from 'node:url';`,
        `const ɵrequire = ɵcreateRequire(import.meta.url);`,
        `globalThis.require = ɵrequire;`,
        `globalThis.__filename = ɵurl.fileURLToPath(import.meta.url);`,
        `globalThis.__dirname = ɵpath.dirname(__filename);`,
      ].join('\n'),
    },
    plugins: [
      importRequirePlugin(['vscode']),
      copy({
        resolveFrom: 'cwd',
        // once: true,
        assets: [
          { from: './language/*', to: './dist/language' },
          { from: './data/extension.js', to: './dist' },
          { from: `./data/${platform()}-${arch()}/**/*`, to: './dist/data' },
          { from: './data/common/**/*', to: './dist/data' },
          {
            from: './node_modules/pdfjs-dist/build/pdf.worker.mjs',
            to: './dist',
          },
        ],
      }),
      swcPlugin({
        define: Define,
        isProd: PROD_ENV,
      }),
    ],
    define: Define,
    outExtension: {
      '.js': '.mjs',
    },
  };
  // worker
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('构建完成');
  } else {
    let result = await esbuild.build(options);
    // fs.writeFileSync('meta.json', JSON.stringify(result.metafile));
    console.log('构建完成');
  }
  // 修改发布版本,去掉依赖
  let packageJson = JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'package.json'), {
      encoding: 'utf-8',
    }),
  );
  packageJson['version'] = process.env['PUBLISH_VERSION'];
  packageJson['engines']['vscode'] = packageJson['version'];
  writeFileSync(
    path.join(OUT_DIR, 'package.json'),
    JSON.stringify(packageJson, undefined, 2),
  );
  // await buildWebgpuWindow();
  if (PROD_ENV) {
    const { $ } = await import('execa');

    //sentry-cli sourcemaps inject --org test --project shb-main ./dist && sentry-cli --url http://debug.localhost:8000/ sourcemaps upload --org test --project shb-main ./dist -r 1.0.0 --log-level=debug
    //debug.shenghuabi.top/api/0/organizations/shenghuabi/files/source-maps/?name=1.0.0
    console.log('准备安装');
    const ENV = {
      ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
    };
    await $({
      cwd: OUT_DIR,
      stdio: 'inherit',
      env: ENV,
      extendEnv: true,
    })`npm i --registry=https://registry.npmmirror.com`;
    console.log('准备移除');
    let platformList = ['darwin', 'linux', 'win32'];
    let archList = ['arm64', 'x64'];
    for (const p of platformList) {
      for (const a of archList) {
        if (p === platform() && a === arch()) {
          continue;
        }

        await $({
          cwd: OUT_DIR,
          stdio: 'inherit',
        })`rimraf -g ./node_modules/onnxruntime-node/**/${p}/${a}`;
      }
    }
    //dist\node_modules\@huggingface\jinja
    const sh = $({
      cwd: OUT_DIR,
      stdio: 'inherit',
    });
    await sh`rimraf -g **/*.{js,mjs}.LEGAL.txt`;
    await sh`rimraf -g ./node_modules/.bin`;
    await sh`rimraf -g ./node_modules/**/LICENSE.*`;
    await sh`rimraf -g ./node_modules/**/LICENSE`;
    await sh`rimraf -g ./node_modules/**/*.{html,md,flow,md,c,cpp,h,gypi,gyp,cc,mts,cts,test}`;
    await sh`rimraf -g ./node_modules/**/{.github,.travis.yml,CMakeLists.txt,tsconfig.json,.nycrc,.eslintrc,.editorconfig,yarn-error.log,readme.markdown,NOTICE,CopyrightNotice.txt}`;

    cleanupEmptyFolders(path.join(OUT_DIR, 'node_modules'));
  }
}

export const cleanupEmptyFolders = (folder: string) => {
  if (!statSync(folder).isDirectory()) return;
  let files = readdirSync(folder);

  if (files.length > 0) {
    files.forEach((file) => cleanupEmptyFolders(join(folder, file)));
    files = readdirSync(folder);
  }

  if (files.length == 0) {
    console.log('removing: ', folder);
    rmdirSync(folder);
  }
};
main();
