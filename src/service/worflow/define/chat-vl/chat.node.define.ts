import * as v from 'valibot';

import {
  actions,
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
      setComponent('prompt-list'),

    ),
  }),
});
