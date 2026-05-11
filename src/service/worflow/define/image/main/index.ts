import { NODE_COMMON } from '../common';
import { IMAGE_NODE_DEFINE } from '../image.node.define';
import { ImageRunner } from './image.runner';

export const ImageMainConfig = {
  ...NODE_COMMON,
  runner: ImageRunner,
  define: IMAGE_NODE_DEFINE,
} as const;
