import { NODE_COMMON } from '../common';
import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';
import { KnowledgeRunner } from './knowledge.runner';

export const KnowledgeMainConfig = {
  ...NODE_COMMON,
  runner: KnowledgeRunner,
  define: KNOWLEDGE_NODE_DEFINE,
} as const;
