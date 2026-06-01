import { InjectionToken } from '@angular/core';
import { WorkflowNodeData } from '@shenghuabi/workflow/share';
import { Node } from '@xyflow/react';
import type { BridgeService } from './service';

export type CustomNode<T extends Record<string, any> = Record<string, any>> =
  Node<WorkflowNodeData & T>;
export const BridgeToken = new InjectionToken<BridgeService>('BridgeToken');
