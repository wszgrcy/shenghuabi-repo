import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { CARD_NODE_DEFINE } from '../card.node.define';
import { NODE_COMMON } from '../common';

export const CardWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: CARD_NODE_DEFINE,
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
