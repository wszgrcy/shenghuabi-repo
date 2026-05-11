import * as v from 'valibot';

import {
  actions,
  condition,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { llmModelConfig } from '@shenghuabi/workflow/share';

export const CHAT_VL_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.pipe(
      v.optional(
        v.object({
          llm: v.optional(llmModelConfig()),
          format: v.optional(v.picklist(['markdown', 'plaintext']), 'markdown'),
        }),
      ),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
      ]),
    ),
    value: v.pipe(
      v.custom<ChatMessageListInputType>(Boolean),
      setComponent(''),
      condition({
        environments: ['display'],
        actions: [
          setComponent('prompt-list'),
          valueChange((fn) => {
            fn({ list: [undefined] }).subscribe(({ list: [value], field }) => {
              if (!Array.isArray(value)) {
                return;
              }
              const inputValue: ChatMessageListInputType = value ?? [];
              field.context
                .parseTemplate(
                  inputValue.flatMap((item) =>
                    item.content.map((item) =>
                      item.type === 'text' ? item.text : '',
                    ),
                  ),
                )
                .then((value: any) => {
                  if (!value) {
                    return;
                  }
                  field.context.changeHandleData(field, 'input', 1, value);
                });
            });
          }),
        ],
      }),
    ),
  }),
});
