import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  priority: -99,
  type: 'chat-vl',
  label: `图片视觉`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  color: 'accent',
  help: ['识别理解图片','生成文本/markdown'].join('\n'),
  // config: defineConfig,
};
