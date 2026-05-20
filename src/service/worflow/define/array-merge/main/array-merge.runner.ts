import { NodeRunnerBase } from '@shenghuabi/workflow';
import { isIterable } from '@share/util/assert/is-iterable';
import * as v from 'valibot';
import { ARRAY_MERGE_NODE_DEFINE } from '../array-merge.define';

export class ArrayMergeRunner extends NodeRunnerBase<
  typeof ARRAY_MERGE_NODE_DEFINE
> {
  override async run() {
    let list = this.inputs.list;
    if (!isIterable(list)) {
      throw new Error('输入值不是可迭代(数组)类型');
    }
    return async () => {
      return [...list].flat(this.inputs.level ?? 1);
    };
  }
}
