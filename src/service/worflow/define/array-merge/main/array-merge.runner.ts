import { NodeRunnerBase } from '@shenghuabi/workflow';
import { isIterable } from '@share/util/assert/is-iterable';
import * as v from 'valibot';
import { ARRAY_MERGE_NODE_DEFINE } from '../array-merge.define';

export class ArrayMergeRunner extends NodeRunnerBase {
  override async run() {
    const key = this.node.inputs[0].value;
    const data = this.inputParams.get(key)!;
    const nodeResult = v.parse(ARRAY_MERGE_NODE_DEFINE, this.node);
    const config = nodeResult.data.config!;
    if (!isIterable(data.value)) {
      throw new Error('输入值不是可迭代(数组)类型');
    }
    return async () => {
      return {
        value: [...data.value].flat(config.level ?? 1),
        extra: data.extra?.flat(config.level ?? 1),
      };
    };
  }
}
