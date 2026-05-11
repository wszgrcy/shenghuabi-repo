import { NODE_COMMON } from '../common';
import { CONDITION_NODE_DEFINE } from '../condition.node.define';
import { ConditionRunner } from './condition.runner';

export const ConditionMainConfig = {
  ...NODE_COMMON,
  runner: ConditionRunner,
  define: CONDITION_NODE_DEFINE,
} as const;
