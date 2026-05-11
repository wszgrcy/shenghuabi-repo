import { NodeRunnerBase } from '@shenghuabi/workflow';
import { WorkflowRunnerService } from '@shenghuabi/workflow';

import { runInNewContext } from 'node:vm';
import { deepClone } from '../../../../../share';
import * as v from 'valibot';
import { CONDITION_NODE_DEFINE } from '../condition.node.define';

export class ConditionRunner extends NodeRunnerBase {
  override async run() {
    const contextObj = this.inputValueObject$$();
    const nodeResult = v.parse(CONDITION_NODE_DEFINE, this.node);
    const config = nodeResult.data.config;
    const conditionList = config.conditions;
    /** 默认为最后一个,也就是else */
    let index = conditionList.length;
    for (let i = 0; i < conditionList.length; i++) {
      const item = conditionList[i];
      try {
        const result = (() => {
          return runInNewContext(item.value, deepClone(contextObj));
        })();
        if (result) {
          index = i;
          break;
        }
      } catch (error) {
        throw new Error(`条件执行失败,表达式: ${item.value}`);
      }
    }

    const subFlow = this.node.subFlowList![index];

    if (!subFlow) {
      return async () => {
        return { value: undefined };
      };
    }
    const newInputs = new Map(this.inputParams);

    const subResult = await this.injector
      .get(WorkflowRunnerService)
      .createContext(subFlow.flow, newInputs, this.context, this.injector)
      .run();
    return async () => {
      return subResult;
    };
  }
}
