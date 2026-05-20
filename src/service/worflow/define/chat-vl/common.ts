import { RUNNER_ORIGIN_OUTPUT } from '@shenghuabi/workflow/share';
import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  priority: -99,
  type: 'chat-vl',
  label: `图片视觉`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [].join('\n'),
  // config: defineConfig,
};
