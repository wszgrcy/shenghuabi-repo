import * as v from 'valibot';

import { actions, setComponent } from '@piying/view-angular-core';

import { llmModelConfig } from '@shenghuabi/workflow/share';
import { RefDefine } from '../../preset/ref-define';
export const CHAT_VL_NODE_DEFINE = v.pipe(
  v.object({
    llm: v.optional(llmModelConfig()),
    format: v.pipe(
      v.optional(v.picklist(['markdown', 'plaintext']), 'markdown'),
      v.title('生成格式'),
    ),
    value: v.pipe(
      v.optional(v.array(v.any()), [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              content: [[{ type: 'text', text: '识别图中文件' }]],
            },
          ],
        },
      ]),
      setComponent('prompt-list'),
      v.title('提示词'),
    ),
    // todo 图片怎么获得?是buffer还是base64
    image: v.pipe(RefDefine, v.title('图片文件路径')),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
  ]),
);
