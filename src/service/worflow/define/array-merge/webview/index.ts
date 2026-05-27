import { NODE_COMMON } from '../common';
import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { ARRAY_MERGE_NODE_DEFINE } from '../array-merge.define';

export const ArrayMergeWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: ARRAY_MERGE_NODE_DEFINE,
  initData: () => {
    console.log('被调用');

    return {
      data: {},
      width: 300,
    };
  },
};
