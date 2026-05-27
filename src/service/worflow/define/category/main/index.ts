import { NODE_COMMON } from '../common';
import { CATEGORY_NODE_DEFINE } from '../category.node.define';
import { CategoryRunner } from './category.runner';

export const CategoryMainConfig = {
  ...NODE_COMMON,
  runner: CategoryRunner,
  configDefine: CATEGORY_NODE_DEFINE,
} as const;
