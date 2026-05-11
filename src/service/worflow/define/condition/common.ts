import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'condition',
  label: `条件`,
  icon: { fontIcon: 'call_split' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: `- 表达式为js表达式\n- 变量自动检测\n- 用于判断序列化后的数据或大语言模型json模式返回值`,

  nodeMode: 'condition',
  // defineConfig,
  outputs: [
    [],
    [
      {
        value: 'else',
        label: '[否则]',
      },
    ],
  ],
};
