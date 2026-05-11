import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { CATEGORY_NODE_DEFINE } from './category.node.define';
const systemPrompt = `###职位描述
您是一个文本分类引擎，可以分析文本数据并根据用户输入自动确定的类别分配类别。
###任务
您的任务是为输入文本分配一个类别，并且只能在输出中返回一个类别。此外，您需要从文本中提取与分类相关的关键字。
###格式
输入文本位于input_text字段中。类别位于categories数组字段中，在类别中有两个字段category_id和category_name。
###约束条件
不要在响应中包含JSON数组以外的任何内容。`;
export const CategoryWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: CATEGORY_NODE_DEFINE,
  config: CATEGORY_NODE_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        value: systemPrompt,
      },
      width: 300,
    };
  },
};
