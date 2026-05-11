import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'image',
  label: `图片输入`,
  icon: { fontIcon: 'image' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 仅用于进行对话使用`].join('\n'),

  // config: defineConfig,
};
