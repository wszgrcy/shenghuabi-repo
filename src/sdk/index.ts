import * as vscode from 'vscode';
import type { ManifestFactoy } from '@shenghuabi/sdk/server';
import { BaseSchema } from 'valibot';
import { createConfig as createConfigI } from '../service/create-config';
import path from 'node:path';
export function shbPluginRegister(
  context: vscode.ExtensionContext,
  factory: ManifestFactoy,
) {
  const result = vscode.extensions.getExtension('wszgrcy.shenghuabi');
  const packageJson = context.extension.packageJSON;
  const definePath = path.join(context.extensionPath, 'config-define.js');
  vscode.commands.registerCommand(`shb.${packageJson['name']}.config`, () => {
    vscode.commands.executeCommand(
      'shenghuabi.pluginConfig.open',
      packageJson,
      definePath,
    );
  });

  if (result?.isActive) {
    return result.exports.register(context.extensionPath, factory);
  } else {
    return result?.activate().then(() => {
      return result.exports.register(context.extensionPath, factory);
    });
  }
}

/** 定义转换为jsonSchema并添加到package.json中 */
export function createConfig<T extends BaseSchema<any, any, any>>(
  define: T,
  prefix: string,
) {
  return createConfigI(define, `shb.${prefix}`);
}
