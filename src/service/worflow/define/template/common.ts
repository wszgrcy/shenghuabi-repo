import { HelpObj } from '@shenghuabi/workflow/share';
import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'template',
  label: `模板`,
  icon: { fontIcon: 'data_object' },
  disableHead: false,
  disableConnect: false,
  color: 'primary',
  help: [
    `- 用于帮助脑图创建卡片和文本组`,
    '- 卡片的内容和标题均为文本模板',
    `${HelpObj.templateVarLine}`,
    `- 卡片的标题为可选,内容为必选`,
    '- 可以将标题设置为{{xx.a}},内容设置{{xx.b}}使用一个变量传入',
    '- 内容应为一个markdown格式的文本(普通的文本创建没有格式)',
    "- 返回一个{type:'card'|'text',title?:string,content:string}对象,可以使用`代码`节点代替",
  ].join('\n'),
  // config: defineConfig,
  // displayConfig: TEMPLATE_NODE_DEFINE,
  inputs: [
    [],
    [
      {
        label: '标题',
        value: '标题',
        inputType: 'object',
      },
      {
        label: '内容',
        value: '内容',
        inputType: 'object',
      },
    ],
  ],
  priority: -96,
};
