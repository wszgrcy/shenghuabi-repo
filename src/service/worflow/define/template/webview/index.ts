import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { TEMPLATE_NODE_DEFINE } from '../template.node.define';

export const TemplateWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  config: TEMPLATE_NODE_DEFINE,

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
