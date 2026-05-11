import { EntityExtractType } from '@shenghuabi/knowledge/knowledge';
export type NodeExtract = EntityExtractType['entity'][number];
/** 保存到collection中的数据 */
export type NodeItem = NodeExtract & {
  chunkId: string;
  kind: 'node';
  fileName: string;
  /** 手动添加,不在payload中 */
  id: string;
};
export type NodeAttr = {
  list: NodeItem[];
};

export type EdgeExtract = EntityExtractType['entity_relation'][number];
export type EdgeItem = EdgeExtract & {
  chunkId: string;
  kind: 'edge';
  name: string;
  fileName: string;
  /** 手动添加,不在payload中 */
  id: string;
};

export type EdgeAttr = {
  list: EdgeItem[];
};
