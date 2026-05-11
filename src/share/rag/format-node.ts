import Graph from 'graphology';
import { Attributes } from 'react';
import { NodeAttr, EdgeAttr } from '../../service/ai/rag/type';
import { arrayToTable } from '../../util/markdown/array-to-markdown';
import { getNodeType } from '../../service/ai/rag/graph-util';
function formatNodeName(name: string, self: string, addLink: boolean) {
  if (!addLink || name === self) {
    return name;
  }
  return `[${name}](${name})`;
}
export function formatNode(
  id: string,
  attr: NodeAttr,
  graph: Graph<NodeAttr, EdgeAttr, Attributes>,
  addLink = false,
) {
  const targetList = graph.outEdges(id);
  const sourceList = graph.inEdges(id);
  return (
    `### 类型\n- ${getNodeType(attr)}\n### 来源\n` +
    attr.list.map((item) => `- ${item.description}`).join('\n') +
    '\n' +
    arrayToTable(
      [...targetList, ...sourceList].map((item) => {
        const attr = graph.getEdgeAttributes(item);
        return [
          formatNodeName(attr.list[0].source, id, addLink),
          formatNodeName(attr.list[0].target, id, addLink),
          attr.list.map((item) => item.description).join(';'),
          attr.list.map((item) => item.keywords?.join(';')) ?? '',
        ];
      }),
      ['来源', '目标', '描述', '关键字'],
      '### 关系',
    )
  );
}
