import { NODE_COMMON } from '../common';
import { SCRIPT_NODE_DEFINE } from '../script.node.define';
import { ScriptRunner } from './script.runner';

export const ScriptMainConfig = {
  ...NODE_COMMON,
  runner: ScriptRunner,
  define: SCRIPT_NODE_DEFINE,
} as const;
