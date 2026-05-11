import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';

export const KnowledgeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  templateConfig: KNOWLEDGE_NODE_DEFINE,
  displayConfig: KNOWLEDGE_NODE_DEFINE,
  config: KNOWLEDGE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        config: { source: 'knowledge', question: '{{问题}}', limit: 5 },
        transform: {
          resizable: true,
        },
        width: 300,
      },
    };
  },
};
