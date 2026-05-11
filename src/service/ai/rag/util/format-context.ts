import { arrayToTable } from '@share/util/markdown';
import { getEdgeStrList, getNodeStrList } from '../graph-util';
// todo 类型重新导出
export function formatContext(context: any) {
  const nodeTable = arrayToTable(context.nodes.map(getNodeStrList), [
    '索引',
    '实体名',
    '类型',
    '描述',
    '权重',
  ]);
  const edgeTable = arrayToTable(context.edges.map(getEdgeStrList), [
    '索引',
    '来源',
    '目标',
    '描述',
    '权重',
  ]);

  return {
    nodeTable: nodeTable,
    edgeTable: edgeTable,
    chunkContent: context.chunks
      .map(
        (value: any, index: any) =>
          `[${index + 1}][${value.fileName}]: ${value.chunk}`,
      )
      .join('\n'),
  };
}
