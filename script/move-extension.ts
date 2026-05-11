import { arch, platform } from 'os';
import path, { join } from 'path';
import { rimrafSync } from 'rimraf';
import { buildExtension } from './build-extension';
// 猜测它调用的应该是默认的fnm指定node 未来可能要同步设置默认版本?
export async function main() {
  const { $ } = await import('execa');
  let isCI = !!process.env['CI'];
  console.log('运行在集成环境', isCI);

  const VSCODE_REL_PATH = isCI ? '..' : '../../third-project';
  let commonPackageName = `VSCode-${platform()}-${arch()}`;
  //C:\code\third-project\VSCode-win32-x64\resources\app\extensions
  let extensionsDir = path.join(
    process.cwd(),
    VSCODE_REL_PATH,
    commonPackageName,
    'resources/app/extensions',
    'shenghuabi',
  );
  console.log('目标位置: ',extensionsDir);

  rimrafSync(`./dist`);
  console.log('准备构建拓展');
  await buildExtension();


  await $({ stdio: 'inherit', shell: true })(`cpx`, [
    '--clean',
    '"./dist/**/*"',
    `${extensionsDir}`,
  ]);
  console.log('插件已复制到本体中');
}
main();
