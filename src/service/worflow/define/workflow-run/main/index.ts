import { NODE_COMMON } from '../common';
import { WORKFLOW_EXEC_DEFINE } from '../workflow-run.define';
import { WorkflowExecRunner } from './workflow-exec.runner';

export const WorkflowExecMainConfig = {
  ...NODE_COMMON,
  runner: WorkflowExecRunner,
  define: WORKFLOW_EXEC_DEFINE,
} as const;
