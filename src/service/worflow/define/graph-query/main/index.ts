import { NODE_COMMON } from '../common';
import { GRAPH_QUERY_NODE_DEFINE } from '../graph-query.node.define';
import { GraphQueryNodeRunner } from './graph-query-node.runner';

export const GraphQueryMainConfig = {
  ...NODE_COMMON,
  runner: GraphQueryNodeRunner,
  define: GRAPH_QUERY_NODE_DEFINE,
} as const;
