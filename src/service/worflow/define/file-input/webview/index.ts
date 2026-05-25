import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { FILE_NODE_DEFINE } from '../file.node.define';
import { NODE_COMMON } from '../common';

export const FileInputWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: FILE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        outputHandleId: 'first',
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
