import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';

export const KnowledgeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: KNOWLEDGE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        config: {
          value: { source: 'knowledge', question: '{{问题}}', limit: 5 },
        },
        transform: {
          resizable: true,
        },
        width: 300,
      },
    };
  },
};
