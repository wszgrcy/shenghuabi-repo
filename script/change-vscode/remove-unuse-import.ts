import { join } from 'path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

let unusedImports = require('eslint-plugin-unused-imports');

export async function removeUnuseImport() {
  console.log('准备移除未使用导入');
  // src/vs/workbench/contrib/debug/browser/debug.contribution.ts
  let VSCODE_REL_PATH = './lib/vscode';
  let cwd = join(process.cwd(), VSCODE_REL_PATH, `/src/vs`);

  let instance = new ESLint({
    cwd,
    // flat config 格式：直接使用数组配置
    overrideConfig: [
      {
        files: ['**/*.ts'],
        ignores: ['**/*.d.ts', '**/*.test.ts'],
        languageOptions: {
          parser: tseslint.parser as any,
          sourceType: 'module',
        },
        plugins: {
          'unused-imports': unusedImports as any,
        },
        rules: {
          'unused-imports/no-unused-imports': 'error',
        },
      },
    ],
    fix: (message) => {
      if (message.message.includes('eslint-disable')) {
        return false
      }
      return true
    },
    // 关键：不使用任何配置文件，只使用 overrideConfig
    overrideConfigFile: true,
  });

  console.log('开始 lint 文件...');
  let list = await instance.lintFiles(['**/*.ts']);
  console.log(`Lint 完成，共处理 ${list.length} 个文件`);

  console.log('开始应用修复...');
  await ESLint.outputFixes(list);
  console.log('修复应用完成');

  let fixCount = list.filter((result) => result.output).length;
  console.log(`已修复 ${fixCount} 个文件中的未使用导入`);
}

removeUnuseImport();
