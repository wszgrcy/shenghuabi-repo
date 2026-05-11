import { countBy, maxBy } from 'lodash-es';
import { EdgeAttr, NodeAttr } from './type';

export function getNodeType(node: NodeAttr) {
  const data = countBy(node.list, (item) => item.type);
  delete data['未知'];
  return maxBy(Object.entries(data), (a) => a[1])?.[0] ?? '未知';
}
/** 用来计算权重 */
export function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export function getNodeStrList(
  item: NodeAttr & {
    degree: number;
  },
  index: number,
) {
  return [
    index + 1,
    item.list[0].name,
    getNodeType(item),
    item.list.map((item) => item.description).join(';'),
    (item.degree * 100).toFixed(0),
  ];
}
export function getEdgeStrList(
  item: EdgeAttr & {
    degree: number;
  },
  i: number,
) {
  return [
    i + 1,
    item.list[0].source,
    item.list[0].target,
    item.list.map((item) => item.description).join(';'),
    (item.degree * 100).toFixed(0),
  ];
}
