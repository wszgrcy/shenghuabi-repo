import { EdgeAttr, NodeAttr } from '@bridge/share';
import Graph from 'graphology';
import { Attributes } from 'react';

export function getNodeData(
  id: string,
  graph: Graph<{ list: NodeFormItem[] }, { list: EdgeFormItem[] }, Attributes>,
) {
  const targetList = graph.outEdges(id);
  const sourceList = graph.inEdges(id);
  return {
    node: graph.getNodeAttributes(id),
    edge: [...targetList, ...sourceList].flatMap(
      (name) => graph.getEdgeAttributes(name).list,
    ),
  };
}
export type NodeFormItem = NodeAttr['list'][number];
export type EdgeFormItem = EdgeAttr['list'][number];
