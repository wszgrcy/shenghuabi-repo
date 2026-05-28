import { toJsonSchema } from '@valibot/to-json-schema';
import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';
// import { ArticleMainConfig } from '../../src/service/worflow/define/article/main/index';
import { NodeMainObj } from '@shenghuabi/workflow';
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
  const toolConfigs: SingleNodeConfig<v.BaseSchema<any, any, any>>[] = [
    // ChatMainConfig,
    // CategoryMainConfig,
    NodeMainObj.TextMainConfig,
    // ArticleMainConfig,
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
          overrideAction: (context) => {
            if (!context.valibotAction.type) {
              console.log(context.valibotAction);
            }
            return context.jsonSchema;
          },
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
