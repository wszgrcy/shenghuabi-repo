import { inject } from 'static-injector';

import { NodeRunnerBase, RunnerResult } from '@shenghuabi/workflow';

import { AbortSignalToken, WorkflowSelectService } from '@shenghuabi/workflow';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { WORKFLOW_EXEC_DEFINE } from '../workflow-run.define';

export class WorkflowExecRunner extends NodeRunnerBase {
  #workflow = inject(WorkflowSelectService);
  #workflowExec = inject(WorkflowExecService);
  #abort = inject(AbortSignalToken);

  override async run(): RunnerResult {
    const node = this.getParsedNode(WORKFLOW_EXEC_DEFINE);
    const workflowData = await this.#workflow.get({
      workflowName: node.data.config.name,
    });
    const result = await this.#workflowExec.exec(
      workflowData,
      { input: this.inputValueObject$$() },
      { showError: false },
      this.emitter.getObserver(),
      this.#abort,
    );
    return async (outputName) => {
      return result;
    };
  }
}
