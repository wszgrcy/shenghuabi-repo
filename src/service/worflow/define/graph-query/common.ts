import { RUNNER_ORIGIN_OUTPUT_KEY } from '@shenghuabi/workflow/share';
import { NodeComponentType } from '@shenghuabi/workflow/share';
const helpList = [
  '- 使用之前请保证已有知识库启用`图索引`',
  '- 使用`问题`对知识库进行动态查询或使用`选择`指定某些节点',
  '> 两者可以共同使用',
  '- `输出`出口在未使用模板的时候,返回的是模板使用的对象,使用模板的时候,返回的是字符串列表',
  '- `原始结果`表示查询后未处理过的数据,方便自行修改',
  '- 模板变量`NODE.name`(实体名) `NODE.type`(类型) `NODE.description`(描述) `NODE.fileName`(所在文件名)',
  '- `实体数量`: 查询时的最大实体数量',
  '- `每实体词条数量`: 每个实体能查询出的最大条数',
];
export const NODE_COMMON: NodeComponentType = {
  type: 'graph-query',
  label: '图谱知识库查询',
  icon: { fontIcon: 'document_scanner' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: helpList.join('\n'),

  // config: defineConfig,
  outputs: [[{ label: '原始结果', value: RUNNER_ORIGIN_OUTPUT_KEY }]],
};
