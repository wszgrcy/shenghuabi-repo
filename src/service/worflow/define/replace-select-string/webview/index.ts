import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { REPLACE_SELECT_STRING_NODE_DEFINE } from '../node.define';

export const ReplaceSelectStringtWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: REPLACE_SELECT_STRING_NODE_DEFINE,
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
