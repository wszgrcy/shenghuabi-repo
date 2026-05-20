import * as v from 'valibot';

import { actions, setComponent, valueChange } from '@piying/view-angular-core';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { llmModelConfig } from '@shenghuabi/workflow/share';
import { RefDefine } from '../../preset/ref-define';
export const CHAT_VL_NODE_DEFINE = v.pipe(
  v.object({
    llm: v.optional(llmModelConfig()),
    format: v.optional(v.picklist(['markdown', 'plaintext']), 'markdown'),
    value: v.pipe(
      v.custom<ChatMessageListInputType>(Boolean),
      setComponent('prompt-list'),
    ),
    // todo 图片怎么获得?是buffer还是base64
    image: RefDefine,
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
  ]),
);
