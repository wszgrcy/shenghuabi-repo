import type { Edge, Node, ReactFlowJsonObject } from '@xyflow/react';
import { MindNode } from './mind/define2';
/** node */
export const DocumentEvent = {
  /** @deprecated */
  update: 'document:update',
  getContent: 'document:getContent',
  focusNode: 'document:focusNode',
};

export enum MindEvent {
  update = 'update',
  toEditor = 'toEditor',
  toEditorResponse = 'toEditorResponse',
  inited = 'inited',
}
interface HandleNode {
  id: string;
  label: string;
}

export interface MindData {
  flow?: Partial<ReactFlowJsonObject<MindNode, Edge>>;
  storeList: Partial<Node>[];
  id?: string;
}
