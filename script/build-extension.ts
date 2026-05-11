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

async function updateSourceMap(
  cwd: string,
  project: string,
  excludes: string[] = [],
) {
  const enableShell = platform() === 'linux';

  const { $ } = await import('execa');
  let excludesStr = excludes.flatMap((a) => ['-i', a]);

  await $({
    cwd: cwd,
    stdio: 'inherit',
    shell: enableShell,
  })('sentry-cli', [
    'sourcemaps',
    'inject',
    ...excludesStr,
    '-o',
    'shenghuabi',
    '-p',
    project,
    '-r',
    'version',
    './',
  ]);
  await $({
    cwd: cwd,
    stdio: 'inherit',
    shell: enableShell,
  })('sentry-cli', [
    '--url',
    'https://debug.shenghuabi.top',
    'sourcemaps',
    'upload',
    ...excludesStr,
    '-o',
    'shenghuabi',
    '-p',
    project,
    '-r',
    `${process.env['PUBLISH_VERSION']!}-${platform()}-${arch()}`,
    // '--log-level=debug',
    './',
  ]);
}
// 发布之前构建
export async function buildExtension() {
  const enableShell = platform() === 'linux';
  console.log('准备构建');

  const { $ } = await import('execa');
  const { path } = await import('@cyia/vfs2');
  const publishSourceMap = process.argv.includes('--capture');

  let be = $({ stdio: 'inherit', shell: enableShell })(`npm run build:prod`);
  let fe = $({
    stdio: 'inherit',
    cwd: join(process.cwd(), './webview/main'),
    shell: enableShell,
  })`npm run build`;
  const cwd = process.cwd();
  let OUT_DIR = path.join(cwd, '/dist');

  await Promise.all([
    be.then(async () => {
      if (publishSourceMap) {
        // console.log('准备上传后端sourcemap');
        // await updateSourceMap(OUT_DIR, 'shb-main', [
        //   'webview/**/*',
        //   'node_modules/**/*',
        // ]);
        // console.log('后端sourcemap上传完成');
      }

      console.log(`---后端构建完成---`);
    }),
    fe
      .then(async () => {
        if (publishSourceMap) {
          // console.log('准备上传webview sourcemap');
          // await updateSourceMap(
          //   path.join(OUT_DIR, 'webview'),
          //   'shb-webview',
          //   [],
          // );
          // console.log('webview sourcemap上传完成');
        }
        console.log('准备删除前端无用文件');

        await $({
          cwd: OUT_DIR,
          stdio: 'inherit',
          shell: enableShell,
        })`npx rimraf -g ./webview/3rdpartylicenses.txt`;
        console.log(`---webview构建完成---`);
      })
      .catch((rej) => {
        console.log('webview构建异常');
        console.log(rej);
        throw rej;
      }),
  ]);
  console.log('构建完成,准备清理');
  await rimraf(['./**/*.map'], {
    glob: {
      cwd: OUT_DIR,
    },
  });
  await rimraf(['./node_modules/**/*.ts'], {
    glob: {
      cwd: OUT_DIR,
    },
    filter: (filePath) => {
      return !path.normalize(filePath).includes('node_modules/@types/node');
    },
  });
  console.log('构建完成');
}

if (require.main === module) {
  buildExtension();
}
