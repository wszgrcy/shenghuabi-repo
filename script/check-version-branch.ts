import { version } from '../package.json';

async function main() {
  let { $ } = await import('execa');
  let core = await import('@actions/core');
  const result2 = await $({
    reject: false,
  })`git ls-remote --tags --exit-code origin refs/tags/${version}`;
  core.setOutput('version', version);
  if (result2.stdout) {
    core.setOutput('needUpdate', 'false');
  } else {
    core.setOutput('needUpdate', 'true');
  }
}

main();
