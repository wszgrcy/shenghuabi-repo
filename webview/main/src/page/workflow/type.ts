import { WorkflowNodeData } from '@shenghuabi/workflow/share';
import { Node } from '@xyflow/react';

export type CustomNode<T extends Record<string, any> = Record<string, any>> =
  Node<WorkflowNodeData & T>;
