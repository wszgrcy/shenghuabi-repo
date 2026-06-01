import { ARTICLE_NODE_DEFINE } from '../article.define';
import { NODE_COMMON } from '../common';
import { ArticleRunner } from './article.runner';

export const ArticleMainConfig = {
  ...NODE_COMMON,
  runner: ArticleRunner,
  configDefine: ARTICLE_NODE_DEFINE,
} as const;
