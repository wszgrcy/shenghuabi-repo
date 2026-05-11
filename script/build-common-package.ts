import { platform } from 'os';
import path, { join } from 'path';

import { rimrafSync } from 'rimraf';
import open from 'open';
import { buildExtension } from './build-extension';
const TENV = {
  // VSCODE_VERSION: '1.98.2',
  // NODE_VERSION: '20.18.2',
  // PUBLISH_VERSION: '1.98.39',
};
// 猜测它调用的应该是默认的fnm指定node 未来可能要同步设置默认版本?
export async function main() {
  const enableShell = platform() === 'linux';
  // const enableShell = true;

  const { $ } = await import('execa');
  const ENV = {
    ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
    ...TENV,
  };
  // console.log('环境变量', process.env);
  let isCI = !!process.env['CI'];
  console.log('运行在集成环境', isCI);

  const VSCODE_REL_PATH = isCI ? '../vscode' : '../../third-project/vscode';
  let vscodeCWD = join(process.cwd(), VSCODE_REL_PATH);
  await Promise.all([
    (async () => {
      console.log('准备修改VSCODE源码');
      if (!isCI) {
        await $({
          stdio: 'inherit',
          cwd: vscodeCWD,
          shell: enableShell,
          env: ENV,
        })(`git`, [
          `reset`,
          `--hard`,
          // vscode依赖版本,只有vscode更新才更新这个
          process.env['VSCODE_VERSION'] ?? `1.103.2`,
        ]);
        await $({
          stdio: 'inherit',
          cwd: vscodeCWD,
          shell: enableShell,
          env: ENV,
        })(`git`, [`clean`, `-f`]);
      }
      console.log('移除hooks');

      await $({
        stdio: 'inherit',
        shell: enableShell,
        env: ENV,
        extendEnv: true,
      })(`rimraf`, [path.join(vscodeCWD, `.git/hooks/pre-commit`)]);
      console.log('修改代码');
      // await $({ stdio: 'inherit' })(`npm`, ['run', 'change:vscode']);
      await $({ stdio: 'inherit', shell: enableShell, env: ENV })(
        `code-recycle`,
        ['--cwd', vscodeCWD, './script/change-vscode/index.ts'],
      );
      console.log('准备安装依赖');
      // 在这里安装依赖,因为lint需要提前安装
      await $({
        stdio: 'inherit',
        cwd: vscodeCWD,
        env: ENV,
        extendEnv: true,
        shell: enableShell,
      })(`npm`, ['install']);
      console.log('依赖安装完成');
      await $({ stdio: 'inherit', shell: enableShell })(`tsx`, [
        './script/change-vscode/remove-unuse-import.ts',
      ]);
      await $({ stdio: 'inherit', cwd: vscodeCWD, shell: enableShell })(`git`, [
        'commit',
        '-a',
        '-m',
        `"构建时间:${new Date().toLocaleString('zh-cn')}"`,
      ]);
      console.log(`---VSCODE源码修改完成---`);
    })(),
  ]);

  console.log('准备构建', platform());
  if (platform() === 'win32') {
    await $({
      stdio: 'inherit',
      cwd: vscodeCWD,
      extendEnv: true,
      shell: enableShell,
      env: ENV,
    })`npm run build:common:win32`;
  } else {
    await $({
      stdio: 'inherit',
      cwd: vscodeCWD,
      extendEnv: true,
      shell: enableShell,
    })`npm run build:linux`;
    if (!isCI) {
      await open(join(vscodeCWD, '.build/linux-x64'));
    }
  }
}
main();
