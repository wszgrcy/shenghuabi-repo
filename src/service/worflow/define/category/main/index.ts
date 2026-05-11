import { NODE_COMMON } from '../common';
import { CATEGORY_NODE_DEFINE } from '../webview/category.node.define';
import { CategoryRunner } from './category.runner';

export const CategoryMainConfig = {
  ...NODE_COMMON,
  runner: CategoryRunner,
  define: CATEGORY_NODE_DEFINE,
} as const;
