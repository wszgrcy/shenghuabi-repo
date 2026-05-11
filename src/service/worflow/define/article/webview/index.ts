import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { ARTICLE_NODE_DEFINE } from '../article.define';
import { NODE_COMMON } from '../common';

export const ArticleWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: ARTICLE_NODE_DEFINE,
  config: ARTICLE_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
