import { NODE_COMMON } from '../common';
import { READ_DOCUMENT_NODE_DEFINE } from '../node.define';
import { ReadDocumentRunner } from './runner';

export const ReadDocumentMainConfig = {
  ...NODE_COMMON,
  runner: ReadDocumentRunner,
  configDefine: READ_DOCUMENT_NODE_DEFINE,
} as const;
