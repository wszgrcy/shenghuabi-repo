import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'category',
  label: `分类器`,
  icon: { fontIcon: 'category' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: `- **实验性**\n- 依赖大语言模型的多轮对话使用例子约束返回`,

  // defineConfig,
  outputs: [[], [{ label: 'else', value: '否则' }]],

  nodeMode: 'condition',
};
