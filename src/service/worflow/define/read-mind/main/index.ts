import { NODE_COMMON } from '../common';
import { READ_MIND_NODE_DEFINE } from '../node.define';
import { ReadMindRunner } from './runner';

export const ReadMindMainConfig = {
  ...NODE_COMMON,
  runner: ReadMindRunner,
  configDefine: READ_MIND_NODE_DEFINE,
} as const;
