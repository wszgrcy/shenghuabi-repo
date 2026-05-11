import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'array-merge',
  label: `数组合并`,
  icon: { fontIcon: 'data_array' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: `- 多层数组结构拍平\n- 用于处理迭代结果`,

  // defineConfig,
};
