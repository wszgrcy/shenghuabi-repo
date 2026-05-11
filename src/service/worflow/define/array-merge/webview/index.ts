import { NODE_COMMON } from '../common';
import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { ARRAY_MERGE_NODE_DEFINE } from '../array-merge.define';

export const ArrayMergeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: ARRAY_MERGE_NODE_DEFINE,
  config: ARRAY_MERGE_NODE_DEFINE,
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
