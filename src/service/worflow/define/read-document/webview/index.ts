import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { READ_DOCUMENT_NODE_DEFINE } from '../node.define';

export const ReadDocumentWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: READ_DOCUMENT_NODE_DEFINE,
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
