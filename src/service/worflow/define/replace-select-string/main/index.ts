import { NODE_COMMON } from '../common';
import { REPLACE_SELECT_STRING_NODE_DEFINE } from '../node.define';
import { Runner } from './runner';

export const ReplaceSelectStringMainConfig = {
  ...NODE_COMMON,
  runner: Runner,
  configDefine: REPLACE_SELECT_STRING_NODE_DEFINE,
} as const;
