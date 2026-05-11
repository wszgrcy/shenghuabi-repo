import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { SCRIPT_NODE_DEFINE } from '../script.node.define';
const DEFAULT_CONTENT = `\n  return async (outputName) => {
    return { value: undefined, extra: undefined }
  }\n`;
export const ScriptWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: SCRIPT_NODE_DEFINE,
  config: SCRIPT_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        value: DEFAULT_CONTENT,
      },
      width: 300,
    };
  },
};
