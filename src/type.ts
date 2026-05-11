import type { Edge } from '@xyflow/react';
import { MindNode } from './share';

export interface MindNodeExtra {
  relation?: {
    input: { node: MindNode; edge: Edge }[];
    output: { node: MindNode; edge: Edge }[];
  };
}
