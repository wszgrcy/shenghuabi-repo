import { NodeComponentType } from '@shenghuabi/workflow/share';

const helpList = [
  `JS/TS代码块`,
  '- 点击按钮打开脚本编辑器',
  '- 编辑后 Ctrl + S 保存后关闭',
  '### 类型声明',
  '- 打开脚本编辑器,相应类型已经导入',
];
export const NODE_COMMON: NodeComponentType = {
  type: 'script',
  label: `代码`,
  icon: { fontIcon: 'code' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: helpList.join('\n'),
  // config: defineConfig,
  priority: -97,
};
