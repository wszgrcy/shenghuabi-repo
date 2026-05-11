import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { WORKFLOW_EXEC_DEFINE } from '../workflow-run.define';

export const WorkflowExecWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: WORKFLOW_EXEC_DEFINE,
  config: WORKFLOW_EXEC_DEFINE,
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
