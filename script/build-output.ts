import path from 'path';
import fs from 'fs';

// 猜测它调用的应该是默认的fnm指定node 未来可能要同步设置默认版本?
export async function main() {
  const { $ } = await import('execa');
  let isCI = !!process.env['CI'];
  console.log('运行在集成环境', isCI);

  const VSCODE_REL_PATH =  './lib/vscode';

  let packageJson = path.join(VSCODE_REL_PATH, 'package.json');
  let content = JSON.parse(
    await fs.promises.readFile(packageJson, { encoding: 'utf-8' }),
  );
  content.version = isCI ? process.env['PUBLISH_VERSION'] : '1.103.999';
  await fs.promises.writeFile(packageJson, JSON.stringify(content));
  await $({
    stdio: 'inherit',
    cwd: VSCODE_REL_PATH,
    extendEnv: true,
    shell: true,
  })`npm run build:output`;
}
main();
