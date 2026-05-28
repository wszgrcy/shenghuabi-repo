import * as esbuild from 'esbuild';
import { join } from 'path';

async function main() {
  const cwd = process.cwd();
  const OUT_DIR = join(cwd, '.contributes-dist');

  await esbuild.build({
    entryPoints: [
      { in: join(cwd, 'script/metadata/contributes.ts'), out: 'index' },
    ],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: OUT_DIR,
    packages: 'external',
    tsconfig: join(cwd, 'tsconfig.build2.json'),
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
    outExtension: {
      '.js': '.mjs',
    },
  });

  console.log('构建完成:', OUT_DIR);
}

main();
