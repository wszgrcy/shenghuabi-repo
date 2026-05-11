import { BaseSchema } from 'valibot';
import fs from 'fs';
import { valibotToVscodeConfig } from '@cyia/vscode-valibot-config';
type Options = {
  /** 启用配置的UI配置,默认开启;还需要shbPluginConfigRegister注册命令 */
  enableConfigUI?: boolean;
};
const DefaultOptions: Options = { enableConfigUI: true };
/** 定义转换为jsonSchema并添加到package.json中 */
export async function setConfigToPackageJson(
  packageJsonFilePath: string,
  define: BaseSchema<any, any, any>,
  options?: Options,
) {
  options = { ...DefaultOptions, ...options };

  const packageJsonData = JSON.parse(
    await fs.promises.readFile(packageJsonFilePath, {
      encoding: 'utf-8',
    }),
  );
  const jsonData = valibotToVscodeConfig(define, {
    title: packageJsonData.displayName,
    prefix: `shb.${packageJsonData.name}`,
  });
  if (options.enableConfigUI) {
    packageJsonData['contributes'] ??= {};
    packageJsonData['contributes']['commands'] ??= [];
    packageJsonData['contributes']['commands'].push({
      command: `shb.${packageJsonData['name']}.config`,
      title: '配置(Config/peizhi)',
      icon: '$(gear)',
      category: 'pluginConfig',
    });
  }
  const data = {
    ...packageJsonData,
    contributes: {
      ...packageJsonData['contributes'],
      configuration: jsonData,
    },
  };
  await fs.promises.writeFile(
    packageJsonFilePath,
    JSON.stringify(data, undefined, 4),
  );
}
