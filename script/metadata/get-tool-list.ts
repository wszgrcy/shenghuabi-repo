import { toJsonSchema } from '@valibot/to-json-schema';
import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';

export interface LanguageModelToolSchema {
  name: string;
  tags: string[];
  toolReferenceName: string;
  displayName: string;
  modelDescription: string;
  canBeReferencedInPrompt: boolean;
  icon?: string;
  inputSchema: Record<string, any>;
}

export async function getNodeDefineToolList(): Promise<
  LanguageModelToolSchema[]
> {
  // 从 completion.service.ts 中获取实际使用的工具列表
  // 这里需要导入实际的 NodeMainConfig 配置
  const { NodeMainObj } = await import('@shenghuabi/workflow');

  const toolConfigs: SingleNodeConfig<v.BaseSchema<any, any, any>>[] = [
    // ChatMainConfig,
    // CategoryMainConfig,
    NodeMainObj.TextMainConfig,
  ];

  return toolConfigs.map((item) => {
    const inputSchema = item.configDefine
      ? toJsonSchema(item.configDefine, {
          ignoreActions: [
            'asControl',
            'trim',
            'viewRawConfig',
            'asVirtualGroup',
            'defineType',
          ],
        })
      : { type: 'object', properties: {} };

    return {
      name: item.type,
      tags: [
        'shenghuabi',
        item.type, // 可以使用 item.type 作为 tag
      ],
      toolReferenceName: item.type,
      displayName: item.type,
      modelDescription: item.help || '',
      canBeReferencedInPrompt: true,
      icon: '$(files)', // 默认图标，可以根据需要自定义
      inputSchema,
    };
  });
}
