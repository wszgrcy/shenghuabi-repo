import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'serialize',
  label: `序列化`,
  icon: { fontIcon: 'data_object' },
  disableHead: false,
  disableConnect: false,
  color: 'primary',
  help: [
    `- 前置节点: 文件输入`,
    `- 用于yml/json文件解析为对象`,
    `- 目前该节点主要用于脑图节点的批量导入`,
  ].join('\n'),
  // component: NodeComponent,
  // config: defineConfig,
  priority: -95,
};
