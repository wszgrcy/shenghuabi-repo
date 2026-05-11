import { NODE_COMMON } from '../common';
import { ARRAY_MERGE_NODE_DEFINE } from '../array-merge.define';
import { ArrayMergeRunner } from './array-merge.runner';

export const ArrayMergeMainConfig = {
  ...NODE_COMMON,
  runner: ArrayMergeRunner,
  define: ARRAY_MERGE_NODE_DEFINE,
} as const;
