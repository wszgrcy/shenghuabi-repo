import { NODE_COMMON } from '../common';
import { RAG_NODE_DEFINE } from '../rag.node.define';
import { RagRunner } from './rag.runner';

export const RagMainConfig = {
  ...NODE_COMMON,
  runner: RagRunner,
  define: RAG_NODE_DEFINE,
} as const;
