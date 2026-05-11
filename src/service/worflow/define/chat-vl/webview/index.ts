import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { CHAT_VL_NODE_DEFINE } from '../chat.node.define';
import { NODE_COMMON } from '../common';
import { getSystemTemplate } from '../util';

export const ChatWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: CHAT_VL_NODE_DEFINE,
  config: CHAT_VL_NODE_DEFINE,
  initData: () => ({
    data: {
      transform: {
        resizable: true,
      },
      value: [getSystemTemplate()],
    },
    width: 300,
  }),
};
