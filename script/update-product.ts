import { platform } from 'os';
import path, { join } from 'path';

export async function main() {
  const enableShell = platform() === 'linux';
  const { $ } = await import('execa');
  let isCI = !!process.env['CI'];
  const VSCODE_REL_PATH = './lib/vscode';
  let vscodeCWD = join(process.cwd(), VSCODE_REL_PATH);
  await $({ stdio: 'inherit', shell: enableShell })(`code-recycle`, [
    '--cwd',
    vscodeCWD,
    './script/change-vscode/update-product.ts',
  ]);
  // const { downloadFile } = await import('@cyia/dl');
  // await downloadFile(
  //   `https://github.com/wszgrcy/shb-ext-tts/releases/download/1.0.1/tts-1.0.1.vsix`,
  //   { directory: path.join(vscodeCWD, 'extension-dist') },
  // );
}
main();
