import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { CONDITION_NODE_DEFINE } from '../condition.node.define';
import { NODE_COMMON } from '../common';

export const ConditionWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: CONDITION_NODE_DEFINE,
  config: CONDITION_NODE_DEFINE,
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
