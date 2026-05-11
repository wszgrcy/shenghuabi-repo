import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'rag',
  label: `索引增强生成`,
  icon: { fontIcon: 'document_scanner' },
  disableHead: false,
  disableConnect: false,
  color: 'primary',
  help: [
    '- 实验性功能',
    '- 参考LightRag设计(未使用源码)',
    '- 使用之前请保证已有知识库启用`图索引`',
  ].join('\n'),
  // config: defineConfig,
  // displayConfig: RAG_NODE_DEFINE,

  inputs: [[{ label: '问题', value: 'question' }]],
  priority: -99,
};
