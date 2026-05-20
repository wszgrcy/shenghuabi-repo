import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { IMAGE_NODE_DEFINE } from '../image.node.define';

export const ImageWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: IMAGE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
