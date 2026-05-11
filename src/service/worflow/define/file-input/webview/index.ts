import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { FILE_NODE_DEFINE } from '../file.node.define';
import { NODE_COMMON } from '../common';

export const FileInputWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  templateConfig: FILE_NODE_DEFINE,
  displayConfig: FILE_NODE_DEFINE,
  config: FILE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        outputName: 'first',
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
