import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { GRAPH_QUERY_NODE_DEFINE } from '../graph-query.node.define';

export const GraphQueryWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: GRAPH_QUERY_NODE_DEFINE,
  config: GRAPH_QUERY_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        value: [],
      },
      width: 300,
    };
  },
};
