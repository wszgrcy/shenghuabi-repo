import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { READ_MIND_NODE_DEFINE } from '../node.define';

export const KnowledgeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: READ_MIND_NODE_DEFINE,
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
