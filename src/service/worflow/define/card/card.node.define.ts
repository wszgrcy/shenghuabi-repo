import { asControl, actions, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';

export const CARD_NODE_DEFINE = v.object({
  useOcr: v.pipe(
    v.optional(v.boolean(), false),
    v.title('图像识别'),
    v.description('选中后会将卡片中的图像识别为文字'),

    actions.wrappers.set([
      { type: 'div', attributes: { class: '!flex-none' } },
      'tooltip',
      'label',
    ]),
  ),
  value: v.pipe(
    // label value但是value不重要
    v.optional(v.array(v.object({ value: v.string() })), []),
    v.title('卡片'),
    v.minLength(1),
    asControl(),
    setComponent('file-input'),
    actions.inputs.set({ mode: 'card' }),
  ),
});
