import { asColumn } from '@share/valibot';
import * as v from 'valibot';

import {
  actions,
  condition,
  valueChange,
  setComponent,
} from '@piying/view-angular-core';
import { llmModelConfig } from '../common';
import { debounceTime } from 'rxjs';

export const DISCOURSE_HELP_DEFINE = v.looseObject({
  data: v.pipe(
    v.looseObject({
      config: v.pipe(
        v.object({
          useLLM: v.pipe(
            v.optional(v.boolean(), false),
            v.title('使用模型提取总结'),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: '!flex-none' } },
            ]),
          ),
          keywordExtraLLM: v.optional(
            llmModelConfig({ label: '关键词提取配置' }),
          ),
          keywordSystemPrompt: v.pipe(
            v.optional(
              v.string(),
              '请提取以下内容的关键词并用逗号连接返回，确保结果准确且格式统一。',
            ),
            v.title('提取关键词'),
          ),
          summarySystemPrompt: v.pipe(
            v.optional(
              v.string(),
              `请根据提供的上下文回复用户
注意:
如果不知道答案，请明确说明。
如果不确定，请询问用户以澄清。
用与用户查询相同的语言进行回复。
如果上下文难以阅读或质量较差，请告知用户并提供最佳可能的答案。
如果答案不在上下文中，但您拥有相关知识，请向用户解释这一点，并用自己的理解提供答案。
上下文:`,
            ),
            v.title('总结关键词'),
          ),
        }),
        asColumn(),
      ),
      value: v.pipe(
        v.optional(v.string(), '{{问题搜索}}'),
        v.title('搜索'),
        condition({
          environments: ['display', 'default'],
          actions: [
            setComponent('string'),
            valueChange((fn) => {
              fn({ list: [undefined] })
                .pipe(debounceTime(100))
                .subscribe(({ list: [value], field }) => {
                  if (typeof value !== 'string') {
                    return;
                  }
                  field.context.changeHandleByTemplate(field, value, 1);
                });
            }),
          ],
        }),
      ),
    }),
    asColumn(),
  ),
});
