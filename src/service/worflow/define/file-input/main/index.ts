import { NODE_COMMON } from '../common';
import { FILE_NODE_DEFINE } from '../file.node.define';
import { FileRunner } from './file.runner';

export const FileInputMainConfig = {
  ...NODE_COMMON,
  runner: FileRunner,
  define: FILE_NODE_DEFINE,
} as const;
