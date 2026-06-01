import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'rag',
  label: `图谱知识库查询`,
  icon: { fontIcon: 'document_scanner' },
  disableHead: false,
  color: 'primary',
  help: [
    '- 使用图谱知识库,对查询内容进行搜索,返回结构性的内容',
    '- 使用之前请保证已有知识库启用`图索引`',
  ].join('\n'),
  // config: defineConfig,
  // displayConfig: RAG_NODE_DEFINE,

  priority: -99,
};
