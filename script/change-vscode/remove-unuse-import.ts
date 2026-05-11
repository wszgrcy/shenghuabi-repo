import { join } from 'path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

let unusedImports = require('eslint-plugin-unused-imports');

export async function removeUnuseImport() {
  console.log('准备移除未使用导入');
  // src/vs/workbench/contrib/debug/browser/debug.contribution.ts
  let VSCODE_REL_PATH =  './lib/vscode';
  let cwd = join(process.cwd(), VSCODE_REL_PATH, `/src/vs`);


  let instance = new ESLint({
    cwd,
    baseConfig: {
      languageOptions: {
        parser: tseslint.parser as any,
        sourceType: 'module',
      },
      rules: {
        'unused-imports/no-unused-imports': 'warn',
      },
      plugins: {
        'unused-imports': unusedImports,
      },
    },
    ignorePatterns: ['**/*.d.ts', '**/*.test.ts'],
    ignore: true,
    allowInlineConfig: false,
    fix: true,
  });

  let list = await instance.lintFiles(['./**/*.ts']);

  await ESLint.outputFixes(list);
}

removeUnuseImport();
