import * as v from 'valibot';
import { CardDataDefine, CardDataType } from './card';

import { v4 } from 'uuid';
import { ChatDataDefine, ChatDataType } from './chat';
import { DrawDataDefine, DrawDataType } from './draw';
import { ImageDataDefine, ImageDataType } from './image';
import type { Node } from '@xyflow/react';
import { NodeCommonType } from './common/node-data';
export const NodeDataDefine = v.union([
  CardDataDefine,
  ChatDataDefine,
  DrawDataDefine,
  ImageDataDefine,
]);
export type NodeDataType = v.InferOutput<typeof NodeDataDefine>;
const LooseNode = v.looseObject({ data: NodeDataDefine });
export const MindConfigDefine = v.object({
  storeList: v.optional(v.array(LooseNode), []),
  flow: v.object({
    nodes: v.optional(v.array(LooseNode), []),
    edges: v.optional(v.array(v.any()), []),
    viewport: v.optional(
      v.object({ x: v.number(), y: v.number(), zoom: v.number() }),
      { x: 0, y: 0, zoom: 1 },
    ),
  }),
  // 全局配置
  globalConfig: v.optional(v.any()),
  draw: v.optional(v.object({ edit: v.any() })),
  id: v.optional(v.string(), () => v4()),
  version: v.optional(v.literal(3), 3),
});

export type MindConfigType = v.InferOutput<typeof MindConfigDefine>;

type MergeNode<TYPE extends string, DATA extends Record<string, any>> = {
  type: TYPE;
  data: DATA;
} & Omit<Node, 'type' | 'data'>;
export type ChatMindNode = MergeNode<'chat', ChatDataType>;
export type DrawMindNode = MergeNode<'draw', DrawDataType>;
export type CardMindNode = MergeNode<'card', CardDataType>;
export type ContainerMindNode = MergeNode<
  'container',
  { group: boolean } & NodeCommonType
>;
export type MindNode =
  | CardMindNode
  | ChatMindNode
  | MergeNode<'image', ImageDataType>
  | DrawMindNode
  | ContainerMindNode;
