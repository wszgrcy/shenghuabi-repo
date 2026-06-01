import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';

export const KnowledgeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: KNOWLEDGE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },
        width: 300,
      },
    };
  },
};
