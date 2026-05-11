import { getSystemTemplate } from '../../const';
import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { RAG_NODE_DEFINE } from '../rag.node.define';

export const RagWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  config: RAG_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        value: [getSystemTemplate()],
      },
      width: 300,
    };
  },
};
