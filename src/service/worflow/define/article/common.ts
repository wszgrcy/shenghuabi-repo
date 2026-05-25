import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'article',
  label: `文章`,
  icon: { fontIcon: 'article' },
  disableHead: false,
  color: 'accent',
  help: ['- 读取工作区文章内容(非知识库内读取)', '- 与`文件`节点读取类似'].join(
    '\n',
  ),

  // articleConfig,
  outputs: [
    [
      { id: 'first', label: '第一项' },
      { id: 'flat', label: '扁平数组' },
    ],
  ],
};
