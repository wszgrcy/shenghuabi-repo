import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'workflow-exec',
  label: `工作流执行`,
  icon: { fontIcon: 'polyline' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 在工作流内执行其他工作流`].join('\n'),
  // config: defineConfig,

  inputs: [],
  outputs: [],
};
